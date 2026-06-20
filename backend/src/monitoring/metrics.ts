import { createServer } from "node:http";

import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { logger, serializeError } from "../utils/logger.js";

type Labels = Record<string, string | number | boolean | null | undefined>;

const graphqlRequests = new Map<string, number>();
const graphqlErrors = new Map<string, number>();
const graphqlDurationBuckets = new Map<string, number>();
const mailEvents = new Map<string, number>();
const durationBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];

const labelText = (labels: Labels) =>
  Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${key}="${String(value ?? "unknown")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')}"`,
    )
    .join(",");

const inc = (store: Map<string, number>, labels: Labels, value = 1) => {
  const key = labelText(labels);
  store.set(key, (store.get(key) ?? 0) + value);
};

const observe = (store: Map<string, number>, labels: Labels, seconds: number) => {
  for (const bucket of durationBuckets) {
    if (seconds <= bucket) {
      inc(store, { ...labels, le: bucket });
    }
  }

  inc(store, { ...labels, le: "+Inf" });
  inc(store, { ...labels, le: "sum" }, seconds);
  inc(store, { ...labels, le: "count" });
};

const renderCounter = (name: string, help: string, store: Map<string, number>) => [
  `# HELP ${name} ${help}`,
  `# TYPE ${name} counter`,
  ...[...store.entries()].map(([key, value]) => `${name}{${key}} ${value}`),
];

const renderHistogram = (name: string, help: string, store: Map<string, number>) => {
  const bucketLines: string[] = [`# HELP ${name} ${help}`, `# TYPE ${name} histogram`];

  for (const [key, value] of store.entries()) {
    if (key.includes('le="sum"')) {
      bucketLines.push(
        `${name}_sum{${key.replace(',le="sum"', "").replace('le="sum",', "").replace('le="sum"', "")}} ${value}`,
      );
      continue;
    }

    if (key.includes('le="count"')) {
      bucketLines.push(
        `${name}_count{${key.replace(',le="count"', "").replace('le="count",', "").replace('le="count"', "")}} ${value}`,
      );
      continue;
    }

    bucketLines.push(`${name}_bucket{${key}} ${value}`);
  }

  return bucketLines;
};

const renderGauge = (
  name: string,
  help: string,
  samples: Array<{ labels: Labels; value: number }>,
) => [
  `# HELP ${name} ${help}`,
  `# TYPE ${name} gauge`,
  ...samples.map((sample) => `${name}{${labelText(sample.labels)}} ${sample.value}`),
];

export const recordGraphQLRequest = (
  operationName: string,
  status: "ok" | "error",
  durationMs: number,
) => {
  const labels = { operation: operationName || "anonymous", status };
  inc(graphqlRequests, labels);
  observe(graphqlDurationBuckets, labels, durationMs / 1000);
};

export const recordGraphQLError = (operationName: string, code: string) => {
  inc(graphqlErrors, { operation: operationName || "anonymous", code });
};

export const recordMailEvent = (
  event: "sent" | "queued" | "retry_sent" | "retry_failed" | "failed",
) => {
  inc(mailEvents, { event });
};

export const startMetricsServer = () => {
  const server = createServer(async (request, response) => {
    if (request.url !== "/metrics") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found\n");
      return;
    }

    try {
      const queuedMailCounts = await prisma.queuedMail.groupBy({
        by: ["status"],
        _count: { _all: true },
      });
      const lines = [
        ...renderGauge("schuldkompass_app_info", "Static application information.", [
          { labels: { service: "backend" }, value: 1 },
        ]),
        ...renderCounter(
          "schuldkompass_graphql_requests_total",
          "Total number of GraphQL requests.",
          graphqlRequests,
        ),
        ...renderCounter(
          "schuldkompass_graphql_errors_total",
          "Total number of GraphQL errors.",
          graphqlErrors,
        ),
        ...renderHistogram(
          "schuldkompass_graphql_request_duration_seconds",
          "GraphQL request duration in seconds.",
          graphqlDurationBuckets,
        ),
        ...renderCounter(
          "schuldkompass_mail_events_total",
          "Total number of mail events.",
          mailEvents,
        ),
        ...renderGauge(
          "schuldkompass_queued_mails",
          "Number of queued mails by delivery status.",
          queuedMailCounts.map((count) => ({
            labels: { status: count.status.toLowerCase() },
            value: count._count._all,
          })),
        ),
      ];

      response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
      response.end(`${lines.join("\n")}\n`);
    } catch (error) {
      logger.error("metrics.render.failed", { error: serializeError(error) });
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("Metrics unavailable\n");
    }
  });

  server.listen(config.metricsPort, () => {
    logger.info("metrics.ready", {
      url: `http://localhost:${config.metricsPort}/metrics`,
    });
  });

  server.on("error", (error) => {
    logger.error("metrics.server.error", { error: serializeError(error) });
  });

  return server;
};
