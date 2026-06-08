import type { IncomingMessage } from "node:http";

import { getUserFromToken } from "../auth/token.js";
import type { GraphQLContext } from "../types/context.js";

export const createContext = async ({ req }: { req: IncomingMessage }): Promise<GraphQLContext> => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  return {
    user: token ? getUserFromToken(token) : null,
  };
};
