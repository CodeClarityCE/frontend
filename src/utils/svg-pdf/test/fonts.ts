import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { PdfFonts } from "../index";

function fontFile(name: string): Uint8Array {
  return new Uint8Array(
    readFileSync(join(process.cwd(), "src/utils/svg-pdf/fonts", name)),
  );
}

/** The vendored fonts read from disk, for tests that make PDFs. */
export function testPdfFonts(): PdfFonts {
  return {
    regular: fontFile("LiberationSans-Regular.ttf"),
    bold: fontFile("LiberationSans-Bold.ttf"),
  };
}
