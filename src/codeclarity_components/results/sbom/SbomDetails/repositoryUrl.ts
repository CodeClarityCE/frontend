// Turns a package's repository URL (git://, git+https://, ssh or
// git@host:path) into a web URL a browser can open, or null.
export function repositoryWebUrl(url: string): string | null {
  let rest = url.trim().replace(/^git\+/, "");
  // Shorthand scp form: git@github.com:owner/repo.git
  const scp = /^[\w.-]+@([\w.-]+):(?!\/\/)(.+)$/.exec(rest);
  if (scp) rest = `https://${scp[1]}/${scp[2]}`;
  else rest = rest.replace(/^(git|ssh|http|https):\/\//, "https://");
  let parsed: URL;
  try {
    parsed = new URL(rest);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname === "") return null;
  const path = parsed.pathname.replace(/\.git$/, "").replace(/\/$/, "");
  return `https://${parsed.hostname}${path}`;
}
