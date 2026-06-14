import { defineStore } from "pinia";

import { gql } from "../lib/graphql";

export type DebtDeletionStatus = "PENDING" | "REJECTED";

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

interface DebtsData {
  debtsOwedToMe: Debt[];
  debtsIOwe: Debt[];
  debtSummary: DebtSummary;
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

export const useDebtsStore = defineStore("debts", {
  state: () => ({
    owedToMe: [] as Debt[],
    iOwe: [] as Debt[],
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
          }
        `);
        this.owedToMe = payload.data?.debtsOwedToMe ?? [];
        this.iOwe = payload.data?.debtsIOwe ?? [];
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
