export const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    emailVerifiedAt: DateTime
    createdAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Debt {
    id: ID!
    debtorName: String!
    debtorEmail: String!
    amount: Float!
    purpose: String!
    comment: String
    category: String!
    debtDate: DateTime!
    paidAt: DateTime
    isPaid: Boolean!
    deletionStatus: String
    deletionReason: String
    deletionRequestedAt: DateTime
    deletionRejectedAt: DateTime
    creator: User!
    createdAt: DateTime!
  }

  type DebtSummary {
    openAmount: Float!
    paidAmount: Float!
    openCount: Int!
    paidCount: Int!
  }

  type AppVersion {
    id: ID!
    version: String!
    title: String!
    description: String!
    notes: [String!]!
    releasedAt: DateTime!
    createdAt: DateTime!
  }

  type ReleaseStatus {
    currentVersion: String
    latestVersion: String
    updateAvailable: Boolean!
    releaseUrl: String
    checkedAt: DateTime!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input CreateDebtInput {
    debtorName: String!
    debtorEmail: String!
    amount: Float!
    purpose: String!
    comment: String
    category: String!
    debtDate: DateTime!
    paidAt: DateTime
  }

  input UpdateDebtInput {
    debtorName: String
    debtorEmail: String
    amount: Float
    purpose: String
    comment: String
    category: String
    debtDate: DateTime
    paidAt: DateTime
  }

  type Query {
    me: User
    debtsOwedToMe: [Debt!]!
    debtsIOwe: [Debt!]!
    debtSummary: DebtSummary!
    latestAppVersion: AppVersion
    appVersions: [AppVersion!]!
    releaseStatus: ReleaseStatus!
  }

  type Mutation {
    register(input: RegisterInput!): Boolean!
    verifyEmail(token: String!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    changePassword(input: ChangePasswordInput!): Boolean!
    createDebt(input: CreateDebtInput!): Debt!
    updateDebt(id: ID!, input: UpdateDebtInput!): Debt!
    deleteDebt(id: ID!): Boolean!
    markDebtPaid(id: ID!, paidAt: DateTime): Debt!
    requestDebtDeletion(id: ID!, reason: String!): Debt!
    approveDebtDeletion(id: ID!): Boolean!
    rejectDebtDeletion(id: ID!): Debt!
  }
`;
