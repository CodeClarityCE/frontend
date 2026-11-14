import boldUrl from "./fonts/LiberationSans-Bold.ttf?url";
import regularUrl from "./fonts/LiberationSans-Regular.ttf?url";
import type { PdfFonts } from "./index";

let loading: Promise<PdfFonts> | null = null;

async function fetchFont(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load font ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Fetches the embedded fonts once, on the first PDF export. */
export function loadPdfFonts(): Promise<PdfFonts> {
  loading ??= Promise.all([fetchFont(regularUrl), fetchFont(boldUrl)]).then(
    ([regular, bold]) => ({ regular, bold }),
  );
  // A failed load is retried on the next export
  loading.catch(() => {
    loading = null;
  });
  return loading;
}
