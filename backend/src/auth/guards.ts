import { GraphQLError } from "graphql";

import type { GraphQLContext } from "../types/context.js";

export const requireUser = (context: GraphQLContext) => {
  if (!context.user) {
    throw new GraphQLError("Nicht angemeldet", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return context.user;
};
