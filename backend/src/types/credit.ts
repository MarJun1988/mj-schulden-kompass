export interface GrantDebtCreditInput {
  debtorName: string;
  debtorEmail: string;
  amount: number;
  note?: string | null;
}

export interface TransferDebtCreditInput {
  creditId: string;
  amount: number;
  note?: string | null;
}
