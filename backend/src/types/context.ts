export interface AuthUser {
  id: string;
  email: string;
}

export interface GraphQLContext {
  user: AuthUser | null;
}
