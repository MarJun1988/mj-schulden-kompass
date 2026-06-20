import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { config } from "./config.js";
import { createContext } from "./graphql/context.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import {
  recordGraphQLError,
  recordGraphQLRequest,
  startMetricsServer,
} from "./monitoring/metrics.js";
import { startMailRetryWorker } from "./services/mailService.js";
import type { GraphQLContext } from "./types/context.js";
import { logger, serializeError } from "./utils/logger.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart(requestContext) {
        const startedAt = Date.now();
        const operationName = requestContext.request.operationName ?? "anonymous";
        const requestId = requestContext.contextValue?.requestId;
        const userId = requestContext.contextValue?.user?.id;
        let hasErrors = false;

        logger.info("graphql.request.started", {
          requestId,
          operationName,
          userId,
        });

        return {
          async didEncounterErrors(errorContext) {
            hasErrors = true;
            for (const error of errorContext.errors) {
              recordGraphQLError(operationName, String(error.extensions?.code ?? "UNKNOWN"));
              logger.error("graphql.request.error", {
                requestId: errorContext.contextValue?.requestId,
                operationName,
                userId: errorContext.contextValue?.user?.id,
                error: {
                  message: error.message,
                  code: error.extensions?.code,
                  path: error.path?.join("."),
                },
              });
            }
          },
          async willSendResponse(responseContext) {
            recordGraphQLRequest(operationName, hasErrors ? "error" : "ok", Date.now() - startedAt);
            logger.info("graphql.request.completed", {
              requestId: responseContext.contextValue?.requestId,
              operationName,
              userId: responseContext.contextValue?.user?.id,
              durationMs: Date.now() - startedAt,
            });
          },
        };
      },
    },
  ],
});

logger.info("app.starting", {
  port: config.port,
  appUrl: config.appUrl,
  smtpHostConfigured: Boolean(config.smtp.host),
  smtpAuthConfigured: Boolean(config.smtp.user),
  metricsPort: config.metricsPort,
  mailRetryEnabled: config.mailRetry.enabled,
  mailRetryIntervalMinutes: config.mailRetry.intervalMinutes,
  logLevel: config.logLevel,
});

startMetricsServer();
startMailRetryWorker();

const { url } = await startStandaloneServer(server, {
  listen: { port: config.port },
  context: createContext,
});

logger.info("app.ready", { url });

process.on("uncaughtException", (error) => {
  logger.error("process.uncaught_exception", { error: serializeError(error) });
});

process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandled_rejection", { error: serializeError(reason) });
});
