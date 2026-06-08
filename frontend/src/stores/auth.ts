import { defineStore } from "pinia";

import { gql, getAuthToken, setAuthToken, type GraphQLResponse } from "../lib/graphql";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface AuthPayload {
  token: string;
  user: User;
}

interface AuthData {
  login?: AuthPayload;
  verifyEmail?: AuthPayload;
}

interface RegisterData {
  register: boolean;
}

interface MeData {
  me: User | null;
}

interface ChangePasswordData {
  changePassword: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getAuthToken(),
    user: null as User | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
  },
  actions: {
    async loadMe() {
      if (!this.token) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const payload: GraphQLResponse<MeData> = await gql<MeData>(`
          query Me {
            me {
              id
              name
              email
              emailVerifiedAt
              createdAt
            }
          }
        `);
        this.user = payload.data?.me ?? null;

        if (!this.user) {
          this.logout();
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Unbekannter Fehler";
        this.logout();
      } finally {
        this.loading = false;
      }
    },
    async login(input: { email: string; password: string }) {
      const payload = await gql<AuthData>(
        `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              token
              user {
                id
                name
                email
                emailVerifiedAt
                createdAt
              }
            }
          }
        `,
        { input },
      );

      const auth = payload.data?.login;
      if (!auth) {
        throw new Error("Login fehlgeschlagen");
      }

      this.token = auth.token;
      this.user = auth.user;
      setAuthToken(auth.token);
    },
    async register(input: { name: string; email: string; password: string }) {
      const payload = await gql<RegisterData>(
        `
          mutation Register($input: RegisterInput!) {
            register(input: $input)
          }
        `,
        { input },
      );

      if (!payload.data?.register) {
        throw new Error("Registrierung fehlgeschlagen");
      }
    },
    async verifyEmail(token: string) {
      const payload = await gql<AuthData>(
        `
          mutation VerifyEmail($token: String!) {
            verifyEmail(token: $token) {
              token
              user {
                id
                name
                email
                emailVerifiedAt
                createdAt
              }
            }
          }
        `,
        { token },
      );

      const auth = payload.data?.verifyEmail;
      if (!auth) {
        throw new Error("E-Mail konnte nicht bestätigt werden.");
      }

      this.token = auth.token;
      this.user = auth.user;
      setAuthToken(auth.token);
    },
    async changePassword(input: { currentPassword: string; newPassword: string }) {
      const payload = await gql<ChangePasswordData>(
        `
          mutation ChangePassword($input: ChangePasswordInput!) {
            changePassword(input: $input)
          }
        `,
        { input },
      );

      if (!payload.data?.changePassword) {
        throw new Error("Passwort konnte nicht geändert werden.");
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      setAuthToken(null);
    },
  },
});
