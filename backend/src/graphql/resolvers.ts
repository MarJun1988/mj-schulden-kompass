import { requireUser } from "../auth/guards.js";
import {
  createDebt,
  deleteDebt,
  getDebtSummary,
  getDebtsIOwe,
  getDebtsOwedToMe,
  markDebtPaid,
  sendDebtReminder,
  approveDebtDeletion,
  approveDebtPaid,
  rejectDebtDeletion,
  rejectDebtPaid,
  requestDebtDeletion,
  requestDebtPaid,
  updateDebt,
} from "../services/debtService.js";
import { changePassword, getMe, login, register, verifyEmail } from "../services/userService.js";
import { getDebtCredits, grantDebtCredit, payDebtWithCredit } from "../services/creditService.js";
import {
  getAppVersions,
  getLatestAppVersion,
  getReleaseStatus,
} from "../services/versionService.js";
import type { GraphQLContext } from "../types/context.js";
import type { CreateDebtInput, UpdateDebtInput } from "../types/debt.js";
import type { GrantDebtCreditInput } from "../types/credit.js";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../types/user.js";

type RootParent = undefined;
type EmptyArgs = Record<string, never>;

export const resolvers = {
  Query: {
    me: async (_parent: RootParent, _args: EmptyArgs, context: GraphQLContext) =>
      context.user ? getMe(context.user.id) : null,
    debtsOwedToMe: async (_parent: RootParent, _args: EmptyArgs, context: GraphQLContext) =>
      getDebtsOwedToMe(requireUser(context)),
    debtsIOwe: async (_parent: RootParent, _args: EmptyArgs, context: GraphQLContext) =>
      getDebtsIOwe(requireUser(context)),
    debtSummary: async (_parent: RootParent, _args: EmptyArgs, context: GraphQLContext) =>
      getDebtSummary(requireUser(context)),
    debtCredits: async (_parent: RootParent, _args: EmptyArgs, context: GraphQLContext) =>
      getDebtCredits(requireUser(context)),
    latestAppVersion: async () => getLatestAppVersion(),
    appVersions: async () => getAppVersions(),
    releaseStatus: async () => getReleaseStatus(),
  },
  Mutation: {
    register: async (_parent: RootParent, args: { input: RegisterInput }) => register(args.input),
    verifyEmail: async (_parent: RootParent, args: { token: string }) => verifyEmail(args.token),
    login: async (_parent: RootParent, args: { input: LoginInput }) => login(args.input),
    changePassword: async (
      _parent: RootParent,
      args: { input: ChangePasswordInput },
      context: GraphQLContext,
    ) => changePassword(requireUser(context).id, args.input),
    createDebt: async (
      _parent: RootParent,
      args: { input: CreateDebtInput },
      context: GraphQLContext,
    ) => createDebt(requireUser(context), args.input),
    updateDebt: async (
      _parent: RootParent,
      args: { id: string; input: UpdateDebtInput },
      context: GraphQLContext,
    ) => updateDebt(requireUser(context), args.id, args.input),
    deleteDebt: async (_parent: RootParent, args: { id: string }, context: GraphQLContext) =>
      deleteDebt(requireUser(context), args.id),
    requestDebtPaid: async (
      _parent: RootParent,
      args: { id: string; reason: string },
      context: GraphQLContext,
    ) => requestDebtPaid(requireUser(context), args.id, args.reason),
    approveDebtPaid: async (
      _parent: RootParent,
      args: { id: string; notifyDebtor?: boolean },
      context: GraphQLContext,
    ) => approveDebtPaid(requireUser(context), args.id, args.notifyDebtor),
    rejectDebtPaid: async (_parent: RootParent, args: { id: string }, context: GraphQLContext) =>
      rejectDebtPaid(requireUser(context), args.id),
    markDebtPaid: async (
      _parent: RootParent,
      args: { id: string; paidAt?: string | null; notifyDebtor?: boolean },
      context: GraphQLContext,
    ) => markDebtPaid(requireUser(context), args.id, args.paidAt, args.notifyDebtor),
    payDebtWithCredit: async (_parent: RootParent, args: { id: string }, context: GraphQLContext) =>
      payDebtWithCredit(requireUser(context), args.id),
    grantDebtCredit: async (
      _parent: RootParent,
      args: { input: GrantDebtCreditInput },
      context: GraphQLContext,
    ) => grantDebtCredit(requireUser(context), args.input),
    sendDebtReminder: async (_parent: RootParent, args: { id: string }, context: GraphQLContext) =>
      sendDebtReminder(requireUser(context), args.id),
    requestDebtDeletion: async (
      _parent: RootParent,
      args: { id: string; reason: string },
      context: GraphQLContext,
    ) => requestDebtDeletion(requireUser(context), args.id, args.reason),
    approveDebtDeletion: async (
      _parent: RootParent,
      args: { id: string },
      context: GraphQLContext,
    ) => approveDebtDeletion(requireUser(context), args.id),
    rejectDebtDeletion: async (
      _parent: RootParent,
      args: { id: string },
      context: GraphQLContext,
    ) => rejectDebtDeletion(requireUser(context), args.id),
  },
};
