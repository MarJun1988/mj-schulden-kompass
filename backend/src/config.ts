import "dotenv/config";

export const config = {
  databaseUrl: requiredEnv("DATABASE_URL"),
  jwtSecret: requiredEnv("JWT_SECRET"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  port: Number(process.env.PORT ?? 4001),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  githubReleaseRepository:
    process.env.GITHUB_RELEASE_REPOSITORY ?? "MarJun1988/mj-schulden-kompass",
  githubReleaseCheckTtlMinutes: Number(process.env.GITHUB_RELEASE_CHECK_TTL_MINUTES ?? 360),
  mailFrom: process.env.MAIL_FROM ?? "SchuldKompass <noreply@schuldkompass.local>",
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ?? "",
  },
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
