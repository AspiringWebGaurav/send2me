const isProduction = process.env.NODE_ENV === "production";
const PREFIX = "[send2me]";

/**
 * Format all log messages with a consistent prefix.
 */
function formatMessage(messages: unknown[]): unknown[] {
  return [PREFIX, ...messages];
}

/**
 * Safe console logger that:
 * - prefixes all logs with `[send2me]`
 * - suppresses non-error logs in production
 * - ensures formatting consistency
 */
export const logger = {
  info: (...messages: unknown[]): void => {
    if (!isProduction) {
      console.info(...formatMessage(messages));
    }
  },

  warn: (...messages: unknown[]): void => {
    if (!isProduction) {
      console.warn(...formatMessage(messages));
    }
  },

  error: (...messages: unknown[]): void => {
    // Always log errors — even in production
    console.error(...formatMessage(messages));
  },

  debug: (...messages: unknown[]): void => {
    if (!isProduction) {
      console.debug(...formatMessage(messages));
    }
  },
};

/**
 * Redacts sensitive strings for logging output.
 * Example: redact("abcdef123") → "ab***23"
 */
export function redact(value?: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}