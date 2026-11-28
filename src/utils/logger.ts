import type { App, ComponentPublicInstance } from "vue";

import { useAuthStore } from "@/stores/auth";
import { BaseRepository, CSRF_HEADER } from "@/utils/api/BaseRepository";

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
// Must equal ALLOWED_FIELDS in api/src/base_modules/logs/logs.controller.ts;
// the umbrella type-sync check (scripts/type-sync) fails CI when they differ.
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

// Posts error reports to the API's POST /logs route with a plain fetch,
// so a failed report never redirects to the login page or shows a toast.
class LogsRepository extends BaseRepository {
  send(report: ErrorReport): Promise<Response> {
    return fetch(this.buildUrl("/logs"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER]: "1",
      },
      credentials: "same-origin",
      body: JSON.stringify(report),
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

// True while a user is signed in; false before the store exists.
function signedIn(): boolean {
  try {
    return useAuthStore().getAuthenticated;
  } catch {
    return false;
  }
}

function report(level: ReportLevel, msg: string, context: LogContext): void {
  if (!signedIn()) return;
  const text = msg.slice(0, MAX_MESSAGE_LENGTH);
  if (isDuplicate(level, text)) return;
  // Fire and forget: a failed report is dropped, never logged again.
  new LogsRepository()
    .send({ level, msg: text, fields: toFields(context) })
    .catch(() => undefined);
}

// Prints to the browser console in dev builds only.
function print(level: LogLevel, msg: string, context: LogContext): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console[level](msg, context);
}

// Adds the stack of a caught error to the context, when it is an Error.
function withStack(context: LogContext, error: unknown): LogContext {
  return error instanceof Error ? { ...context, stack: error.stack } : context;
}

export const logger = {
  /** Sends an error report to the server; pass a caught error to send its stack. */
  error(msg: string, context: LogContext = {}, error?: unknown): void {
    const full = withStack(context, error);
    print("error", msg, full);
    report("error", msg, full);
  },
  /** Sends a warning report to the server; pass a caught error to send its stack. */
  warn(msg: string, context: LogContext = {}, error?: unknown): void {
    const full = withStack(context, error);
    print("warn", msg, full);
    report("warn", msg, full);
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

// Turns any thrown value into a message.
function describeFailure(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
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
    logger.error(
      describeFailure(err),
      { component: componentName(instance) },
      err,
    );
  };

  const onRejection = (event: PromiseRejectionEvent): void => {
    logger.error(describeFailure(event.reason), {}, event.reason);
  };
  window.addEventListener("unhandledrejection", onRejection);

  return (): void => {
    app.config.errorHandler = undefined;
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
