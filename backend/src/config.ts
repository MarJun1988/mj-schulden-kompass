import "dotenv/config";

export const config = {
  databaseUrl: requiredEnv("DATABASE_URL"),
  jwtSecret: requiredEnv("JWT_SECRET"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  port: Number(process.env.PORT ?? 4001),
  metricsPort: Number(process.env.METRICS_PORT ?? 9101),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  githubReleaseCheckEnabled: process.env.GITHUB_RELEASE_CHECK_ENABLED !== "false",
  githubReleaseRepository:
    process.env.GITHUB_RELEASE_REPOSITORY ?? "MarJun1988/mj-schulden-kompass",
  githubReleaseCheckTtlMinutes: Number(process.env.GITHUB_RELEASE_CHECK_TTL_MINUTES ?? 360),
  githubReleaseCheckTimeoutMs: Number(process.env.GITHUB_RELEASE_CHECK_TIMEOUT_MS ?? 3000),
  mailFrom: process.env.MAIL_FROM ?? "SchuldKompass <noreply@schuldkompass.local>",
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ?? "",
    connectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10000),
    greetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10000),
    socketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 15000),
  },
  mailRetry: {
    enabled: process.env.MAIL_RETRY_ENABLED !== "false",
    intervalMinutes: Number(process.env.MAIL_RETRY_INTERVAL_MINUTES ?? 5),
    maxAttempts: Number(process.env.MAIL_RETRY_MAX_ATTEMPTS ?? 10),
    batchSize: Number(process.env.MAIL_RETRY_BATCH_SIZE ?? 20),
  },
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
