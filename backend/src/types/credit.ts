export interface GrantDebtCreditInput {
  debtorName: string;
  debtorEmail: string;
  amount: number;
  note?: string | null;
}
