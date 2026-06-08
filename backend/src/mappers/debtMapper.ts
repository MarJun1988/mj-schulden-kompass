import type { Prisma } from "@prisma/client";

import { toGraphQLUser } from "./userMapper.js";

export const debtInclude = {
  creator: true,
} satisfies Prisma.DebtInclude;

export type DebtWithCreator = Prisma.DebtGetPayload<{ include: typeof debtInclude }>;

export const toGraphQLDebt = (debt: DebtWithCreator) => ({
  ...debt,
  amount: Number(debt.amount),
  debtDate: debt.debtDate.toISOString(),
  paidAt: debt.paidAt?.toISOString() ?? null,
  deletionRequestedAt: debt.deletionRequestedAt?.toISOString() ?? null,
  deletionRejectedAt: debt.deletionRejectedAt?.toISOString() ?? null,
  isPaid: Boolean(debt.paidAt),
  createdAt: debt.createdAt.toISOString(),
  creator: toGraphQLUser(debt.creator),
});
