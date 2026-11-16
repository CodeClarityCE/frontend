import type { ConnectionTestResult } from "../tickets.entity";

const FALLBACK =
  "ClickUp did not accept the connection test. Check the credentials and try again.";

// The reason a connection test failed, in plain words; raw provider replies are replaced.
export function connectionFailureText(
  result: Pick<ConnectionTestResult, "error"> | undefined,
): string {
  const error = result?.error?.trim();
  if (!error || error.includes("{") || /api error/i.test(error)) {
    return FALLBACK;
  }
  return error;
}
