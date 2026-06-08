export interface AuthUser {
  id: string;
  email: string;
}

export interface GraphQLContext {
  requestId: string;
  user: AuthUser | null;
}
