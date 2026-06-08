import jwt from "jsonwebtoken";

import { config } from "../config.js";
import type { AuthUser } from "../types/context.js";

interface AuthTokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
}

const isAuthTokenPayload = (payload: string | jwt.JwtPayload): payload is AuthTokenPayload =>
  typeof payload !== "string" &&
  typeof payload.sub === "string" &&
  typeof payload.email === "string";

export const createToken = (user: AuthUser) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: "7d" });

export const getUserFromToken = (token: string): AuthUser | null => {
  try {
    const payload = jwt.verify(token, config.jwtSecret);

    return isAuthTokenPayload(payload) ? { id: payload.sub, email: payload.email } : null;
  } catch {
    return null;
  }
};
