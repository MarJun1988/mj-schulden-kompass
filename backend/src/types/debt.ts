export interface CreateDebtInput {
  debtorName: string;
  debtorEmail: string;
  amount: number;
  purpose: string;
  comment?: string | null;
  category: string;
  debtDate: string;
  paidAt?: string | null;
}

export interface UpdateDebtInput {
  debtorName?: string;
  debtorEmail?: string;
  amount?: number;
  purpose?: string;
  comment?: string | null;
  category?: string;
  debtDate?: string;
  paidAt?: string | null;
}
