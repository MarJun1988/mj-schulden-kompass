import type { IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";

import { getUserFromToken } from "../auth/token.js";
import type { GraphQLContext } from "../types/context.js";
import { logger } from "../utils/logger.js";

export const createContext = async ({ req }: { req: IncomingMessage }): Promise<GraphQLContext> => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const requestId = randomUUID();
  const user = token ? getUserFromToken(token) : null;

  logger.debug("request.context.created", {
    requestId,
    authenticated: Boolean(user),
    userId: user?.id,
  });

  return {
    requestId,
    user,
  };
};
