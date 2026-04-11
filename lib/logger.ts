type LogLevel = "info" | "warn" | "error";

function stringifyArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

export function log(level: LogLevel, context: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${level.toUpperCase()}][${context}]`;

  if (level === "error") {
    console.error(prefix, message, data ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, data ?? "");
  } else {
    console.log(prefix, message, data ?? "");
  }
}

export const logger = {
  info: (ctx: string, msg: string, data?: unknown) => log("info", ctx, msg, data),
  warn: (ctx: string, msg: string, data?: unknown) => log("warn", ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log("error", ctx, msg, data),
  infoRaw: (context: string, ...args: unknown[]) => log("info", context, stringifyArgs(args)),
  warnRaw: (context: string, ...args: unknown[]) => log("warn", context, stringifyArgs(args)),
  errorRaw: (context: string, ...args: unknown[]) => log("error", context, stringifyArgs(args)),
};
