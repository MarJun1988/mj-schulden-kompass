type LogLevel = "debug" | "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
const minimumLevel = levels[configuredLevel] ?? levels.info;

const writeLog = (level: LogLevel, event: string, fields: LogFields = {}) => {
  if (levels[level] < minimumLevel) {
    return;
  }

  const entry = {
    time: new Date().toISOString(),
    level,
    event,
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  debug: (event: string, fields?: LogFields) => writeLog("debug", event, fields),
  info: (event: string, fields?: LogFields) => writeLog("info", event, fields),
  warn: (event: string, fields?: LogFields) => writeLog("warn", event, fields),
  error: (event: string, fields?: LogFields) => writeLog("error", event, fields),
};

export const maskEmail = (email?: string | null) => {
  if (!email) {
    return null;
  }

  const [name = "", domain = ""] = email.split("@");
  const maskedName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  const [domainName = "", ...domainRest] = domain.split(".");
  const maskedDomain =
    domainName.length <= 2 ? `${domainName[0] ?? "*"}*` : `${domainName.slice(0, 2)}***`;
  return `${maskedName}@${[maskedDomain, ...domainRest].filter(Boolean).join(".")}`;
};

export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: "Unknown error",
  };
};
