import { GraphQLError } from "graphql";

import { prisma } from "../db/prisma.js";
import { creditInclude, toGraphQLCredit } from "../mappers/creditMapper.js";
import { debtInclude, toGraphQLDebt } from "../mappers/debtMapper.js";
import type { AuthUser } from "../types/context.js";
import type { GrantDebtCreditInput, TransferDebtCreditInput } from "../types/credit.js";
import { normalizeEmail } from "../utils/email.js";
import { logger, maskEmail } from "../utils/logger.js";
import {
  sendDebtCreditGrantedMail,
  sendDebtCreditPaymentMail,
  sendDebtCreditTransferMail,
} from "./mailService.js";

export const getDebtCredits = async (user: AuthUser) => {
  const email = normalizeEmail(user.email);
  const credits = await prisma.debtCredit.findMany({
    where: {
      OR: [{ creatorId: user.id }, { debtorEmail: email }],
    },
    include: creditInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return credits.map(toGraphQLCredit);
};

export const grantDebtCredit = async (user: AuthUser, input: GrantDebtCreditInput) => {
  const amount = normalizeAmount(input.amount);
  const debtorEmail = normalizeEmail(input.debtorEmail);
  const debtorName = input.debtorName.trim();
  const note = input.note?.trim() || null;

  if (!debtorName || !debtorEmail) {
    throw new GraphQLError("Bitte gib Schuldner und E-Mail für das Guthaben an.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (amount <= 0) {
    throw new GraphQLError("Das Guthaben muss größer als 0 sein.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  logger.info("credit.grant.started", {
    userId: user.id,
    debtorEmail: maskEmail(debtorEmail),
    amount,
  });

  const credit = await prisma.$transaction(async (tx) => {
    const upserted = await tx.debtCredit.upsert({
      where: { creatorId_debtorEmail: { creatorId: user.id, debtorEmail } },
      update: {
        debtorName,
        balance: { increment: amount },
      },
      create: {
        creatorId: user.id,
        debtorName,
        debtorEmail,
        balance: amount,
      },
    });

    await tx.debtCreditEntry.create({
      data: {
        creditId: upserted.id,
        type: "GRANT",
        amount,
        note,
      },
    });

    return tx.debtCredit.findUniqueOrThrow({
      where: { id: upserted.id },
      include: creditInclude,
    });
  });

  logger.info("credit.grant.completed", {
    userId: user.id,
    creditId: credit.id,
    debtorEmail: maskEmail(credit.debtorEmail),
  });

  const sent = await sendDebtCreditGrantedMail({
    debtorName: credit.debtorName,
    debtorEmail: credit.debtorEmail,
    amount,
    balance: credit.balance,
    note,
    creator: credit.creator,
  });

  if (!sent) {
    logger.warn("credit.grant.mail_failed", {
      userId: user.id,
      creditId: credit.id,
      debtorEmail: maskEmail(credit.debtorEmail),
    });
  }

  return toGraphQLCredit(credit);
};

export const payDebtWithCredit = async (user: AuthUser, id: string) => {
  const userEmail = normalizeEmail(user.email);

  const debt = await prisma.debt.findUnique({
    where: { id },
    include: debtInclude,
  });

  if (!debt || (debt.creatorId !== user.id && debt.debtorEmail !== userEmail)) {
    throw new GraphQLError("Schuld nicht gefunden.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (debt.paidAt) {
    throw new GraphQLError("Diese Schuld ist bereits bezahlt.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const amount = Number(debt.amount);

  const payment = await prisma.$transaction(async (tx) => {
    const credit = await tx.debtCredit.findUnique({
      where: {
        creatorId_debtorEmail: { creatorId: debt.creatorId, debtorEmail: debt.debtorEmail },
      },
    });

    if (!credit || Number(credit.balance) < amount) {
      throw new GraphQLError("Das Guthaben reicht für diese Schuld nicht aus.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const updatedCredit = await tx.debtCredit.update({
      where: { id: credit.id },
      data: { balance: { decrement: amount } },
    });

    await tx.debtCreditEntry.create({
      data: {
        creditId: credit.id,
        type: "PAYMENT",
        amount,
        debtId: debt.id,
        note: `Für "${debt.purpose}" verwendet.`,
      },
    });

    const updatedDebt = await tx.debt.update({
      where: { id: debt.id },
      data: {
        paidAt: new Date(),
        paymentStatus: null,
        paymentReason: null,
        paymentRequestedAt: null,
        paymentRejectedAt: null,
      },
      include: debtInclude,
    });

    return { updatedCredit, updatedDebt };
  });

  logger.info("credit.payment.completed", {
    userId: user.id,
    debtId: payment.updatedDebt.id,
    debtorEmail: maskEmail(payment.updatedDebt.debtorEmail),
  });

  const sent = await sendDebtCreditPaymentMail({
    debtorName: payment.updatedDebt.debtorName,
    debtorEmail: payment.updatedDebt.debtorEmail,
    amount,
    remainingBalance: payment.updatedCredit.balance,
    purpose: payment.updatedDebt.purpose,
    category: payment.updatedDebt.category,
    paidAt: payment.updatedDebt.paidAt ?? new Date(),
    creator: payment.updatedDebt.creator,
  });

  if (!sent) {
    logger.warn("credit.payment.mail_failed", {
      userId: user.id,
      debtId: payment.updatedDebt.id,
      debtorEmail: maskEmail(payment.updatedDebt.debtorEmail),
    });
  }

  return toGraphQLDebt(payment.updatedDebt);
};

export const transferDebtCredit = async (user: AuthUser, input: TransferDebtCreditInput) => {
  const amount = normalizeAmount(input.amount);
  const note = input.note?.trim() || null;

  if (amount <= 0) {
    throw new GraphQLError("Der Rücküberweisungsbetrag muss größer als 0 sein.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  logger.info("credit.transfer.started", {
    userId: user.id,
    creditId: input.creditId,
    amount,
  });

  const credit = await prisma.$transaction(async (tx) => {
    const existing = await tx.debtCredit.findFirst({
      where: { id: input.creditId, creatorId: user.id },
    });

    if (!existing) {
      throw new GraphQLError("Guthaben nicht gefunden.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (Number(existing.balance) < amount) {
      throw new GraphQLError("Das Guthaben reicht für diese Rücküberweisung nicht aus.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    await tx.debtCredit.update({
      where: { id: existing.id },
      data: { balance: { decrement: amount } },
    });

    await tx.debtCreditEntry.create({
      data: {
        creditId: existing.id,
        type: "TRANSFER",
        amount,
        note: note ?? "Als Überweisung zurückgezahlt.",
      },
    });

    return tx.debtCredit.findUniqueOrThrow({
      where: { id: existing.id },
      include: creditInclude,
    });
  });

  logger.info("credit.transfer.completed", {
    userId: user.id,
    creditId: credit.id,
    debtorEmail: maskEmail(credit.debtorEmail),
  });

  const sent = await sendDebtCreditTransferMail({
    debtorName: credit.debtorName,
    debtorEmail: credit.debtorEmail,
    amount,
    balance: credit.balance,
    note,
    creator: credit.creator,
  });

  if (!sent) {
    logger.warn("credit.transfer.mail_failed", {
      userId: user.id,
      creditId: credit.id,
      debtorEmail: maskEmail(credit.debtorEmail),
    });
  }

  return toGraphQLCredit(credit);
};

const normalizeAmount = (amount: number) => Math.round(amount * 100) / 100;
