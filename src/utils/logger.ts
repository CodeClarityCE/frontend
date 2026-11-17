import type { App, ComponentPublicInstance } from "vue";

import { useAuthStore } from "@/stores/auth";
import { BaseRepository } from "@/utils/api/BaseRepository";

type ReportLevel = "error" | "warn";
type LogLevel = ReportLevel | "info" | "debug";

/** Context that may travel with a log call; only allow-listed keys reach the server. */
export interface LogContext {
  route?: string;
  component?: string;
  organizationId?: string;
  projectId?: string;
  analysisId?: string;
  stack?: string;
  [key: string]: unknown;
}

// Only these context keys leave the browser; the server filters again.
const ALLOWED_FIELDS = [
  "route",
  "component",
  "organizationId",
  "projectId",
  "analysisId",
  "stack",
] as const;

type ReportFields = Partial<Record<(typeof ALLOWED_FIELDS)[number], string>>;

const MAX_STACK_LENGTH = 4096;
const MAX_MESSAGE_LENGTH = 2048;

interface ErrorReport {
  level: ReportLevel;
  msg: string;
  fields: ReportFields;
}

// Keeps allow-listed string fields, names the current page and trims the stack.
function toFields(context: LogContext): ReportFields {
  const fields: ReportFields = { route: window.location.pathname };
  for (const key of ALLOWED_FIELDS) {
    const value = context[key];
    if (typeof value === "string") fields[key] = value;
  }
  if (fields.stack !== undefined) {
    fields.stack = fields.stack.slice(0, MAX_STACK_LENGTH);
  }
  return fields;
}

// Posts error reports to the API's POST /logs route.
class LogsRepository extends BaseRepository {
  send(report: ErrorReport, bearerToken: string): Promise<unknown> {
    return this.postRequest({
      url: this.buildUrl("/logs"),
      bearerToken,
      data: report,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
  }
}

const DUPLICATE_WINDOW_MS = 10_000;

// When each level and message pair was last sent.
const lastSent = new Map<string, number>();

// True when the same report was sent within the duplicate window.
function isDuplicate(level: ReportLevel, msg: string): boolean {
  const now = Date.now();
  for (const [key, sentAt] of lastSent) {
    if (now - sentAt >= DUPLICATE_WINDOW_MS) lastSent.delete(key);
  }
  const key = `${level}:${msg}`;
  if (lastSent.has(key)) return true;
  lastSent.set(key, now);
  return false;
}

// The session token, or undefined when signed out or before the store exists.
function sessionToken(): string | undefined {
  try {
    const auth = useAuthStore();
    return auth.getAuthenticated ? auth.getToken : undefined;
  } catch {
    return undefined;
  }
}

function report(level: ReportLevel, msg: string, context: LogContext): void {
  const token = sessionToken();
  if (!token) return;
  const text = msg.slice(0, MAX_MESSAGE_LENGTH);
  if (isDuplicate(level, text)) return;
  // Fire and forget: a failed report is dropped, never logged again.
  new LogsRepository()
    .send({ level, msg: text, fields: toFields(context) }, token)
    .catch(() => undefined);
}

// Prints to the browser console in dev builds only.
function print(level: LogLevel, msg: string, context: LogContext): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console[level](msg, context);
}

export const logger = {
  /** Sends an error report to the server. */
  error(msg: string, context: LogContext = {}): void {
    print("error", msg, context);
    report("error", msg, context);
  },
  /** Sends a warning report to the server. */
  warn(msg: string, context: LogContext = {}): void {
    print("warn", msg, context);
    report("warn", msg, context);
  },
  /** Prints in dev builds only; never sent. */
  info(msg: string, context: LogContext = {}): void {
    print("info", msg, context);
  },
  /** Prints in dev builds only; never sent. */
  debug(msg: string, context: LogContext = {}): void {
    print("debug", msg, context);
  },
};

// Turns any thrown value into a message and, for errors, a stack.
function describeFailure(reason: unknown): { msg: string; stack?: string } {
  if (reason instanceof Error)
    return { msg: reason.message, stack: reason.stack };
  return { msg: String(reason) };
}

function componentName(
  instance: ComponentPublicInstance | null,
): string | undefined {
  return instance?.$options.name ?? instance?.$options.__name;
}

/**
 * Reports uncaught component errors and unhandled promise rejections.
 * Call once at startup; returns a function that removes the handlers.
 */
export function installLogger(app: App): () => void {
  app.config.errorHandler = (err, instance): void => {
    const { msg, stack } = describeFailure(err);
    logger.error(msg, { component: componentName(instance), stack });
  };

  const onRejection = (event: PromiseRejectionEvent): void => {
    const { msg, stack } = describeFailure(event.reason);
    logger.error(msg, { stack });
  };
  window.addEventListener("unhandledrejection", onRejection);

  return (): void => {
    app.config.errorHandler = undefined;
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
