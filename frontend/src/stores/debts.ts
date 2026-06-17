import { defineStore } from "pinia";

import { gql } from "../lib/graphql";

export type DebtDeletionStatus = "PENDING" | "REJECTED";
export type DebtPaymentStatus = "PENDING" | "REJECTED";

export interface DebtUser {
  id: string;
  name: string;
  email: string;
}

export interface Debt {
  id: string;
  debtorName: string;
  debtorEmail: string;
  amount: number;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: string;
  paidAt: string | null;
  isPaid: boolean;
  paymentStatus: DebtPaymentStatus | null;
  paymentReason: string | null;
  paymentRequestedAt: string | null;
  paymentRejectedAt: string | null;
  deletionStatus: DebtDeletionStatus | null;
  deletionReason: string | null;
  deletionRequestedAt: string | null;
  deletionRejectedAt: string | null;
  creator: DebtUser;
  createdAt: string;
}

export interface DebtSummary {
  openAmount: number;
  paidAmount: number;
  openCount: number;
  paidCount: number;
}

export type DebtCreditEntryType = "GRANT" | "PAYMENT";

export interface DebtCreditEntry {
  id: string;
  type: DebtCreditEntryType;
  amount: number;
  note: string | null;
  debtId: string | null;
  createdAt: string;
}

export interface DebtCredit {
  id: string;
  creator: DebtUser;
  debtorName: string;
  debtorEmail: string;
  balance: number;
  entries: DebtCreditEntry[];
  createdAt: string;
  updatedAt: string;
}

interface DebtsData {
  debtsOwedToMe: Debt[];
  debtsIOwe: Debt[];
  debtSummary: DebtSummary;
  debtCredits: DebtCredit[];
}

interface CreateDebtData {
  createDebt: Debt;
}

interface UpdateDebtData {
  updateDebt: Debt;
}

interface DeleteDebtData {
  deleteDebt: boolean;
}

interface MarkDebtPaidData {
  markDebtPaid: Debt;
}

interface PayDebtWithCreditData {
  payDebtWithCredit: Debt;
}

interface GrantDebtCreditData {
  grantDebtCredit: DebtCredit;
}

interface RequestDebtPaidData {
  requestDebtPaid: Debt;
}

interface ApproveDebtPaidData {
  approveDebtPaid: Debt;
}

interface RejectDebtPaidData {
  rejectDebtPaid: Debt;
}

interface SendDebtReminderData {
  sendDebtReminder: boolean;
}

interface RequestDebtDeletionData {
  requestDebtDeletion: Debt;
}

interface RejectDebtDeletionData {
  rejectDebtDeletion: Debt;
}

interface ApproveDebtDeletionData {
  approveDebtDeletion: boolean;
}

const debtFields = `
  id
  debtorName
  debtorEmail
  amount
  purpose
  comment
  category
  debtDate
  paidAt
  isPaid
  paymentStatus
  paymentReason
  paymentRequestedAt
  paymentRejectedAt
  deletionStatus
  deletionReason
  deletionRequestedAt
  deletionRejectedAt
  createdAt
  creator {
    id
    name
    email
  }
`;

const creditFields = `
  id
  debtorName
  debtorEmail
  balance
  createdAt
  updatedAt
  creator {
    id
    name
    email
  }
  entries {
    id
    type
    amount
    note
    debtId
    createdAt
  }
`;

export const useDebtsStore = defineStore("debts", {
  state: () => ({
    owedToMe: [] as Debt[],
    iOwe: [] as Debt[],
    credits: [] as DebtCredit[],
    summary: {
      openAmount: 0,
      paidAmount: 0,
      openCount: 0,
      paidCount: 0,
    } as DebtSummary,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchDebts() {
      this.loading = true;
      this.error = null;

      try {
        const payload = await gql<DebtsData>(`
          query Debts {
            debtsOwedToMe {
              ${debtFields}
            }
            debtsIOwe {
              ${debtFields}
            }
            debtSummary {
              openAmount
              paidAmount
              openCount
              paidCount
            }
            debtCredits {
              ${creditFields}
            }
          }
        `);
        this.owedToMe = payload.data?.debtsOwedToMe ?? [];
        this.iOwe = payload.data?.debtsIOwe ?? [];
        this.credits = payload.data?.debtCredits ?? [];
        this.summary = payload.data?.debtSummary ?? this.summary;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Unbekannter Fehler";
      } finally {
        this.loading = false;
      }
    },
    async createDebt(input: {
      debtorName: string;
      debtorEmail: string;
      amount: number;
      purpose: string;
      comment?: string | null;
      category: string;
      debtDate: string;
      paidAt?: string | null;
      notifyDebtor?: boolean;
    }) {
      const payload = await gql<CreateDebtData>(
        `
          mutation CreateDebt($input: CreateDebtInput!) {
            createDebt(input: $input) {
              ${debtFields}
            }
          }
        `,
        { input },
      );

      const created = payload.data?.createDebt;
      if (created) {
        this.owedToMe = [created, ...this.owedToMe];
        await this.fetchDebts();
      }
    },
    async updateDebt(
      id: string,
      input: {
        debtorName?: string;
        debtorEmail?: string;
        amount?: number;
        purpose?: string;
        comment?: string | null;
        category?: string;
        debtDate?: string;
        paidAt?: string | null;
      },
    ) {
      const payload = await gql<UpdateDebtData>(
        `
          mutation UpdateDebt($id: ID!, $input: UpdateDebtInput!) {
            updateDebt(id: $id, input: $input) {
              ${debtFields}
            }
          }
        `,
        { id, input },
      );

      const updated = payload.data?.updateDebt;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async deleteDebt(id: string) {
      const payload = await gql<DeleteDebtData>(
        `
          mutation DeleteDebt($id: ID!) {
            deleteDebt(id: $id)
          }
        `,
        { id },
      );

      if (payload.data?.deleteDebt) {
        this.owedToMe = this.owedToMe.filter((debt) => debt.id !== id);
        await this.fetchDebts();
      }
    },
    async markPaid(
      id: string,
      options?: {
        paidAt?: string | null;
        notifyDebtor?: boolean;
      },
    ) {
      const payload = await gql<MarkDebtPaidData>(
        `
          mutation MarkDebtPaid($id: ID!, $paidAt: DateTime, $notifyDebtor: Boolean) {
            markDebtPaid(id: $id, paidAt: $paidAt, notifyDebtor: $notifyDebtor) {
              ${debtFields}
            }
          }
        `,
        { id, paidAt: options?.paidAt ?? null, notifyDebtor: options?.notifyDebtor ?? true },
      );

      const updated = payload.data?.markDebtPaid;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async payWithCredit(id: string) {
      const payload = await gql<PayDebtWithCreditData>(
        `
          mutation PayDebtWithCredit($id: ID!) {
            payDebtWithCredit(id: $id) {
              ${debtFields}
            }
          }
        `,
        { id },
      );

      const updated = payload.data?.payDebtWithCredit;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        this.iOwe = this.iOwe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async grantCredit(input: {
      debtorName: string;
      debtorEmail: string;
      amount: number;
      note?: string | null;
    }) {
      const payload = await gql<GrantDebtCreditData>(
        `
          mutation GrantDebtCredit($input: GrantDebtCreditInput!) {
            grantDebtCredit(input: $input) {
              ${creditFields}
            }
          }
        `,
        { input },
      );

      const credit = payload.data?.grantDebtCredit;
      if (credit) {
        this.credits = [credit, ...this.credits.filter((item) => item.id !== credit.id)];
        await this.fetchDebts();
      }
    },
    async requestPaid(id: string, reason: string) {
      const payload = await gql<RequestDebtPaidData>(
        `
          mutation RequestDebtPaid($id: ID!, $reason: String!) {
            requestDebtPaid(id: $id, reason: $reason) {
              ${debtFields}
            }
          }
        `,
        { id, reason },
      );

      const updated = payload.data?.requestDebtPaid;
      if (updated) {
        this.iOwe = this.iOwe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async approvePaid(id: string, notifyDebtor = true) {
      const payload = await gql<ApproveDebtPaidData>(
        `
          mutation ApproveDebtPaid($id: ID!, $notifyDebtor: Boolean) {
            approveDebtPaid(id: $id, notifyDebtor: $notifyDebtor) {
              ${debtFields}
            }
          }
        `,
        { id, notifyDebtor },
      );

      const updated = payload.data?.approveDebtPaid;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async rejectPaid(id: string) {
      const payload = await gql<RejectDebtPaidData>(
        `
          mutation RejectDebtPaid($id: ID!) {
            rejectDebtPaid(id: $id) {
              ${debtFields}
            }
          }
        `,
        { id },
      );

      const updated = payload.data?.rejectDebtPaid;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async sendReminder(id: string) {
      const payload = await gql<SendDebtReminderData>(
        `
          mutation SendDebtReminder($id: ID!) {
            sendDebtReminder(id: $id)
          }
        `,
        { id },
      );

      return payload.data?.sendDebtReminder ?? false;
    },
    async requestDeletion(id: string, reason: string) {
      const payload = await gql<RequestDebtDeletionData>(
        `
          mutation RequestDebtDeletion($id: ID!, $reason: String!) {
            requestDebtDeletion(id: $id, reason: $reason) {
              ${debtFields}
            }
          }
        `,
        { id, reason },
      );

      const updated = payload.data?.requestDebtDeletion;
      if (updated) {
        this.iOwe = this.iOwe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
    async approveDeletion(id: string) {
      const payload = await gql<ApproveDebtDeletionData>(
        `
          mutation ApproveDebtDeletion($id: ID!) {
            approveDebtDeletion(id: $id)
          }
        `,
        { id },
      );

      if (payload.data?.approveDebtDeletion) {
        this.owedToMe = this.owedToMe.filter((debt) => debt.id !== id);
        await this.fetchDebts();
      }
    },
    async rejectDeletion(id: string) {
      const payload = await gql<RejectDebtDeletionData>(
        `
          mutation RejectDebtDeletion($id: ID!) {
            rejectDebtDeletion(id: $id) {
              ${debtFields}
            }
          }
        `,
        { id },
      );

      const updated = payload.data?.rejectDebtDeletion;
      if (updated) {
        this.owedToMe = this.owedToMe.map((debt) => (debt.id === id ? updated : debt));
        await this.fetchDebts();
      }
    },
  },
});
