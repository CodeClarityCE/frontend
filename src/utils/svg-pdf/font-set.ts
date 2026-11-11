import type { PdfFile } from "./pdf-file";
import type { TrueTypeFont } from "./truetype";

function hex4(value: number): string {
  return value.toString(16).toUpperCase().padStart(4, "0");
}

/** A code point as UTF-16 hex, with a surrogate pair above the BMP. */
function utf16Hex(codePoint: number): string {
  if (codePoint <= 0xffff) return hex4(codePoint);
  const offset = codePoint - 0x10000;
  return hex4(0xd800 + (offset >> 10)) + hex4(0xdc00 + (offset & 0x3ff));
}

/** Maps glyph ids back to text, so viewers can copy and search labels. */
function toUnicodeCmap(glyphs: Map<number, number>): string {
  const entries = [...glyphs].map(
    ([glyph, code]) => `<${hex4(glyph)}> <${utf16Hex(code)}>`,
  );
  const blocks: string[] = [];
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    blocks.push(`${chunk.length} beginbfchar\n${chunk.join("\n")}\nendbfchar`);
  }
  return [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /Adobe-Identity-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <FFFF>",
    "endcodespacerange",
    ...blocks,
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
}

interface UsedFont {
  name: string;
  font: TrueTypeFont;
  /** Glyph id to the first code point drawn with it */
  glyphs: Map<number, number>;
}

/** Tracks the fonts and glyphs a page uses, then embeds them. */
export class FontSet {
  private readonly used = new Map<TrueTypeFont, UsedFont>();

  /** Encodes text for a Tj operator and returns the font resource name. */
  encode(
    font: TrueTypeFont,
    text: string,
  ): { name: string; hex: string; width: number } {
    let entry = this.used.get(font);
    if (!entry) {
      entry = { name: `F${this.used.size + 1}`, font, glyphs: new Map() };
      this.used.set(font, entry);
    }
    let hex = "";
    let advance = 0;
    for (const char of text) {
      const code = char.codePointAt(0)!;
      const glyph = font.glyphOf(code);
      if (glyph !== 0 && !entry.glyphs.has(glyph))
        entry.glyphs.set(glyph, code);
      hex += hex4(glyph);
      advance += font.advanceOf(glyph);
    }
    return { name: entry.name, hex, width: advance / font.unitsPerEm };
  }

  /** Writes each used font and returns the page's /Font dictionary. */
  async embed(file: PdfFile): Promise<string> {
    const refs: string[] = [];
    for (const { name, font, glyphs } of this.used.values()) {
      const scale = (value: number): number =>
        Math.round((value * 1000) / font.unitsPerEm);
      const program = await file.addStream(
        font.bytes,
        ` /Length1 ${font.bytes.length}`,
      );
      const descriptor = file.add(
        `<< /Type /FontDescriptor /FontName /${font.postScriptName} /Flags 32 /FontBBox [${font.bbox.map(scale).join(" ")}] /ItalicAngle 0 /Ascent ${scale(font.ascent)} /Descent ${scale(font.descent)} /CapHeight ${scale(font.capHeight)} /StemV 80 /FontFile2 ${program} 0 R >>`,
      );
      const widths = [...glyphs.keys()]
        .sort((a, b) => a - b)
        .map((glyph) => `${glyph} [${scale(font.advanceOf(glyph))}]`)
        .join(" ");
      const descendant = file.add(
        `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${font.postScriptName} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /DW ${scale(font.advanceOf(0))} /W [${widths}] /CIDToGIDMap /Identity >>`,
      );
      const toUnicode = await file.addStream(toUnicodeCmap(glyphs));
      const type0 = file.add(
        `<< /Type /Font /Subtype /Type0 /BaseFont /${font.postScriptName} /Encoding /Identity-H /DescendantFonts [${descendant} 0 R] /ToUnicode ${toUnicode} 0 R >>`,
      );
      refs.push(`/${name} ${type0} 0 R`);
    }
    return refs.length > 0 ? `/Font << ${refs.join(" ")} >>` : "";
  }
}
