import { GraphQLError } from "graphql";

import { prisma } from "../db/prisma.js";
import { debtInclude, toGraphQLDebt } from "../mappers/debtMapper.js";
import type { AuthUser } from "../types/context.js";
import type { CreateDebtInput, UpdateDebtInput } from "../types/debt.js";
import { normalizeEmail } from "../utils/email.js";
import { logger, maskEmail } from "../utils/logger.js";
import { sendDebtCreatedMail, sendDebtReminderMail } from "./mailService.js";

export const getDebtsOwedToMe = async (user: AuthUser) => {
  logger.debug("debt.list_owed_to_me.started", { userId: user.id });
  const debts = await prisma.debt.findMany({
    where: { creatorId: user.id },
    include: debtInclude,
    orderBy: [{ paidAt: "asc" }, { debtDate: "desc" }, { createdAt: "desc" }],
  });

  logger.debug("debt.list_owed_to_me.completed", { userId: user.id, count: debts.length });
  return debts.map(toGraphQLDebt);
};

export const getDebtsIOwe = async (user: AuthUser) => {
  logger.debug("debt.list_i_owe.started", {
    userId: user.id,
    email: maskEmail(user.email),
  });
  const debts = await prisma.debt.findMany({
    where: { debtorEmail: user.email },
    include: debtInclude,
    orderBy: [{ paidAt: "asc" }, { debtDate: "desc" }, { createdAt: "desc" }],
  });

  logger.debug("debt.list_i_owe.completed", { userId: user.id, count: debts.length });
  return debts.map(toGraphQLDebt);
};

export const getDebtSummary = async (user: AuthUser) => {
  logger.debug("debt.summary.started", { userId: user.id });
  const debts = await prisma.debt.findMany({
    where: { creatorId: user.id },
    select: { amount: true, paidAt: true },
  });

  return debts.reduce(
    (summary, debt) => {
      const amount = Number(debt.amount);
      if (debt.paidAt) {
        summary.paidAmount += amount;
        summary.paidCount += 1;
      } else {
        summary.openAmount += amount;
        summary.openCount += 1;
      }

      return summary;
    },
    { openAmount: 0, paidAmount: 0, openCount: 0, paidCount: 0 },
  );
};

export const createDebt = async (user: AuthUser, input: CreateDebtInput) => {
  logger.info("debt.create.started", {
    userId: user.id,
    debtorEmail: maskEmail(input.debtorEmail),
    category: input.category.trim(),
    isPaid: Boolean(input.paidAt),
  });

  const debt = await prisma.debt.create({
    data: {
      creatorId: user.id,
      debtorName: input.debtorName.trim(),
      debtorEmail: normalizeEmail(input.debtorEmail),
      amount: input.amount,
      purpose: input.purpose.trim(),
      comment: input.comment?.trim() || null,
      category: input.category.trim(),
      debtDate: new Date(input.debtDate),
      paidAt: input.paidAt ? new Date(input.paidAt) : null,
    },
    include: debtInclude,
  });
  await sendDebtCreatedMail(debt);

  logger.info("debt.create.completed", {
    userId: user.id,
    debtId: debt.id,
    debtorEmail: maskEmail(debt.debtorEmail),
    category: debt.category,
    isPaid: Boolean(debt.paidAt),
  });

  return toGraphQLDebt(debt);
};

export const updateDebt = async (user: AuthUser, id: string, input: UpdateDebtInput) => {
  logger.info("debt.update.started", { userId: user.id, debtId: id });
  await assertDebtOwner(user, id);

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      debtorName: input.debtorName?.trim(),
      debtorEmail: input.debtorEmail ? normalizeEmail(input.debtorEmail) : undefined,
      amount: input.amount,
      purpose: input.purpose?.trim(),
      comment: input.comment === undefined ? undefined : input.comment?.trim() || null,
      category: input.category?.trim(),
      debtDate: input.debtDate ? new Date(input.debtDate) : undefined,
      paidAt: input.paidAt === undefined ? undefined : input.paidAt ? new Date(input.paidAt) : null,
    },
    include: debtInclude,
  });

  logger.info("debt.update.completed", {
    userId: user.id,
    debtId: debt.id,
    debtorEmail: maskEmail(debt.debtorEmail),
    category: debt.category,
    isPaid: Boolean(debt.paidAt),
  });

  return toGraphQLDebt(debt);
};

export const markDebtPaid = async (user: AuthUser, id: string, paidAt?: string | null) => {
  logger.info("debt.mark_paid.started", {
    userId: user.id,
    debtId: id,
    customPaidAt: Boolean(paidAt),
  });
  await assertDebtOwner(user, id);

  const debt = await prisma.debt.update({
    where: { id },
    data: { paidAt: paidAt ? new Date(paidAt) : new Date() },
    include: debtInclude,
  });

  logger.info("debt.mark_paid.completed", { userId: user.id, debtId: debt.id });

  return toGraphQLDebt(debt);
};

export const sendDebtReminder = async (user: AuthUser, id: string) => {
  logger.info("debt.reminder.started", { userId: user.id, debtId: id });
  const existing = await assertDebtOwner(user, id);

  if (existing.paidAt) {
    logger.warn("debt.reminder.rejected", {
      userId: user.id,
      debtId: id,
      reason: "already_paid",
    });
    throw new GraphQLError("Für bereits bezahlte Schulden kann keine Erinnerung gesendet werden.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const debt = await prisma.debt.findUnique({
    where: { id },
    include: debtInclude,
  });

  if (!debt) {
    logger.warn("debt.reminder.rejected", {
      userId: user.id,
      debtId: id,
      reason: "not_found_after_owner_check",
    });
    throw new GraphQLError("Schuld nicht gefunden.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const sent = await sendDebtReminderMail(debt);

  if (!sent) {
    logger.warn("debt.reminder.failed", {
      userId: user.id,
      debtId: debt.id,
      debtorEmail: maskEmail(debt.debtorEmail),
    });
    throw new GraphQLError("Erinnerungsmail konnte nicht gesendet werden.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }

  logger.info("debt.reminder.completed", {
    userId: user.id,
    debtId: debt.id,
    debtorEmail: maskEmail(debt.debtorEmail),
  });

  return true;
};

export const deleteDebt = async (user: AuthUser, id: string) => {
  logger.info("debt.delete.started", { userId: user.id, debtId: id });
  await assertDebtOwner(user, id);
  await prisma.debt.delete({ where: { id } });

  logger.info("debt.delete.completed", { userId: user.id, debtId: id });

  return true;
};

export const requestDebtDeletion = async (user: AuthUser, id: string, reason: string) => {
  const trimmedReason = reason.trim();
  logger.info("debt.deletion_request.started", {
    userId: user.id,
    debtId: id,
    reasonLength: trimmedReason.length,
  });

  if (trimmedReason.length < 3) {
    logger.warn("debt.deletion_request.rejected", {
      userId: user.id,
      debtId: id,
      reason: "reason_too_short",
    });
    throw new GraphQLError("Bitte gib eine Begründung für die Löschung ein.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await assertDebtDebtor(user, id);

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      deletionStatus: "PENDING",
      deletionReason: trimmedReason,
      deletionRequestedAt: new Date(),
      deletionRejectedAt: null,
    },
    include: debtInclude,
  });

  logger.info("debt.deletion_request.completed", { userId: user.id, debtId: debt.id });

  return toGraphQLDebt(debt);
};

export const approveDebtDeletion = async (user: AuthUser, id: string) => {
  logger.info("debt.deletion_approve.started", { userId: user.id, debtId: id });
  const existing = await assertDebtOwner(user, id);

  if (existing.deletionStatus !== "PENDING") {
    logger.warn("debt.deletion_approve.rejected", {
      userId: user.id,
      debtId: id,
      reason: "no_pending_request",
    });
    throw new GraphQLError("Für diese Schuld liegt kein Löschantrag vor.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await prisma.debt.delete({ where: { id } });
  logger.info("debt.deletion_approve.completed", { userId: user.id, debtId: id });
  return true;
};

export const rejectDebtDeletion = async (user: AuthUser, id: string) => {
  logger.info("debt.deletion_reject.started", { userId: user.id, debtId: id });
  const existing = await assertDebtOwner(user, id);

  if (existing.deletionStatus !== "PENDING") {
    logger.warn("debt.deletion_reject.rejected", {
      userId: user.id,
      debtId: id,
      reason: "no_pending_request",
    });
    throw new GraphQLError("Für diese Schuld liegt kein Löschantrag vor.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      deletionStatus: "REJECTED",
      deletionRejectedAt: new Date(),
    },
    include: debtInclude,
  });

  logger.info("debt.deletion_reject.completed", { userId: user.id, debtId: debt.id });

  return toGraphQLDebt(debt);
};

const assertDebtOwner = async (user: AuthUser, id: string) => {
  const existing = await prisma.debt.findFirst({
    where: { id, creatorId: user.id },
  });

  if (!existing) {
    logger.warn("debt.owner_assertion.failed", { userId: user.id, debtId: id });
    throw new GraphQLError("Schuld nicht gefunden.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return existing;
};

const assertDebtDebtor = async (user: AuthUser, id: string) => {
  const existing = await prisma.debt.findFirst({
    where: { id, debtorEmail: user.email },
  });

  if (!existing) {
    logger.warn("debt.debtor_assertion.failed", { userId: user.id, debtId: id });
    throw new GraphQLError("Schuld nicht gefunden.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return existing;
};
