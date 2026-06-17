import type { Prisma } from "@prisma/client";

import { toGraphQLUser } from "./userMapper.js";

export const creditInclude = {
  creator: true,
  entries: {
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.DebtCreditInclude;

export type DebtCreditWithDetails = Prisma.DebtCreditGetPayload<{ include: typeof creditInclude }>;

export const toGraphQLCredit = (credit: DebtCreditWithDetails) => ({
  ...credit,
  balance: Number(credit.balance),
  createdAt: credit.createdAt.toISOString(),
  updatedAt: credit.updatedAt.toISOString(),
  creator: toGraphQLUser(credit.creator),
  entries: credit.entries.map((entry) => ({
    ...entry,
    amount: Number(entry.amount),
    createdAt: entry.createdAt.toISOString(),
  })),
});
