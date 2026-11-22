import { type APIRequestContext, expect } from "@playwright/test";

// Reads the emails the stack sent from the real-stack job's mail catcher (Mailpit), as a user
// reads their inbox. E2E_MAILBOX_URL points at its HTTP API.
const MAILBOX = process.env.E2E_MAILBOX_URL ?? "http://127.0.0.1:8025";

interface Summary {
  ID: string;
  Subject: string;
}

/**
 * Waits for an email to `to` whose subject matches `subject`, and returns the path and query of
 * the first link in it whose path starts with `prefix`.
 */
export async function linkFromEmail(
  request: APIRequestContext,
  to: string,
  subject: RegExp,
  prefix: string,
): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${MAILBOX}/api/v1/search`, {
          params: { query: `to:"${to}"` },
        });
        const { messages } = (await response.json()) as {
          messages: Summary[];
        };
        id = messages.find((m) => subject.test(m.Subject))?.ID;
        return id;
      },
      { message: `an email to ${to} matching ${subject}`, timeout: 60_000 },
    )
    .toBeTruthy();
  const response = await request.get(`${MAILBOX}/api/v1/message/${id}`);
  const { HTML, Text } = (await response.json()) as {
    HTML: string;
    Text: string;
  };
  const body = `${HTML} ${Text}`.replaceAll("&amp;", "&");
  const link = (body.match(/https?:\/\/[^\s"'<>]+/g) ?? [])
    .map((url) => new URL(url))
    .find((url) => url.pathname.startsWith(prefix));
  expect(link, `a ${prefix} link in the email to ${to}`).toBeTruthy();
  return `${link!.pathname}${link!.search}`;
}
