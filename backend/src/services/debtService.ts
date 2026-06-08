import { GraphQLError } from "graphql";

import { prisma } from "../db/prisma.js";
import { debtInclude, toGraphQLDebt } from "../mappers/debtMapper.js";
import type { AuthUser } from "../types/context.js";
import type { CreateDebtInput, UpdateDebtInput } from "../types/debt.js";
import { normalizeEmail } from "../utils/email.js";
import { sendDebtCreatedMail } from "./mailService.js";

export const getDebtsOwedToMe = async (user: AuthUser) => {
  const debts = await prisma.debt.findMany({
    where: { creatorId: user.id },
    include: debtInclude,
    orderBy: [{ paidAt: "asc" }, { debtDate: "desc" }, { createdAt: "desc" }],
  });

  return debts.map(toGraphQLDebt);
};

export const getDebtsIOwe = async (user: AuthUser) => {
  const debts = await prisma.debt.findMany({
    where: { debtorEmail: user.email },
    include: debtInclude,
    orderBy: [{ paidAt: "asc" }, { debtDate: "desc" }, { createdAt: "desc" }],
  });

  return debts.map(toGraphQLDebt);
};

export const getDebtSummary = async (user: AuthUser) => {
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

  return toGraphQLDebt(debt);
};

export const updateDebt = async (user: AuthUser, id: string, input: UpdateDebtInput) => {
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

  return toGraphQLDebt(debt);
};

export const markDebtPaid = async (user: AuthUser, id: string, paidAt?: string | null) => {
  await assertDebtOwner(user, id);

  const debt = await prisma.debt.update({
    where: { id },
    data: { paidAt: paidAt ? new Date(paidAt) : new Date() },
    include: debtInclude,
  });

  return toGraphQLDebt(debt);
};

export const deleteDebt = async (user: AuthUser, id: string) => {
  await assertDebtOwner(user, id);
  await prisma.debt.delete({ where: { id } });

  return true;
};

export const requestDebtDeletion = async (user: AuthUser, id: string, reason: string) => {
  const trimmedReason = reason.trim();

  if (trimmedReason.length < 3) {
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

  return toGraphQLDebt(debt);
};

export const approveDebtDeletion = async (user: AuthUser, id: string) => {
  const existing = await assertDebtOwner(user, id);

  if (existing.deletionStatus !== "PENDING") {
    throw new GraphQLError("Für diese Schuld liegt kein Löschantrag vor.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await prisma.debt.delete({ where: { id } });
  return true;
};

export const rejectDebtDeletion = async (user: AuthUser, id: string) => {
  const existing = await assertDebtOwner(user, id);

  if (existing.deletionStatus !== "PENDING") {
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

  return toGraphQLDebt(debt);
};

const assertDebtOwner = async (user: AuthUser, id: string) => {
  const existing = await prisma.debt.findFirst({
    where: { id, creatorId: user.id },
  });

  if (!existing) {
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
    throw new GraphQLError("Schuld nicht gefunden.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return existing;
};
