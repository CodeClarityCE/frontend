import tokenCss from "@/assets/main.css?raw";

/** The custom properties declared in the first CSS block `block` matches. */
export function tokensOf(css: string, block: RegExp): [string, string][] {
  const body = block.exec(css)?.[1] ?? "";
  return [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]);
}

/** The light theme's tokens from main.css, whatever theme the page shows. */
export function lightTokens(): Map<string, string> {
  return new Map(tokensOf(tokenCss, /:root\s*\{([^}]*)\}/));
}
