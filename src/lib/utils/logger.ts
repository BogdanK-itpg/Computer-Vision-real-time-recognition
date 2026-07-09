const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, module: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${dataStr}`;
}

export const logger = {
  debug: (module: string, message: string, data?: unknown) => {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", module, message, data));
    }
  },
  info: (module: string, message: string, data?: unknown) => {
    if (shouldLog("info")) {
      console.info(formatMessage("info", module, message, data));
    }
  },
  warn: (module: string, message: string, data?: unknown) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", module, message, data));
    }
  },
  error: (module: string, message: string, data?: unknown) => {
    if (shouldLog("error")) {
      console.error(formatMessage("error", module, message, data));
    }
  },
};
