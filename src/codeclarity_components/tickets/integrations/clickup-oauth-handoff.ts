// Holds the ClickUp OAuth token in memory between the callback page and the setup dialog.
let pendingToken: string | null = null;

export function holdClickUpOAuthToken(token: string): void {
  pendingToken = token;
}

// Returns the held token once, then forgets it.
export function takeClickUpOAuthToken(): string | null {
  const token = pendingToken;
  pendingToken = null;
  return token;
}
