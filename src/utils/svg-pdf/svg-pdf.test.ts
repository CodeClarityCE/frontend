import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { svgToPdf } from "./index";
import { testPdfFonts } from "./test/fonts";

const FONTS = testPdfFonts();

interface PdfObject {
  dict: string;
  stream: Uint8Array | null;
}

/** Reads every object of a PDF, inflating compressed streams. */
function parsePdf(bytes: Uint8Array): {
  text: string;
  objects: Map<number, PdfObject>;
} {
  const text = Buffer.from(bytes).toString("latin1");
  const objects = new Map<number, PdfObject>();
  for (const match of text.matchAll(
    /(\d+) 0 obj\n([\s\S]*?)(?:\nstream\n([\s\S]*?)\nendstream)?\nendobj/g,
  )) {
    const dict = match[2]!;
    let stream: Uint8Array | null = null;
    if (match[3] !== undefined) {
      const raw = Buffer.from(match[3], "latin1");
      stream = dict.includes("/FlateDecode") ? inflateSync(raw) : raw;
    }
    objects.set(Number(match[1]), { dict, stream });
  }
  return { text, objects };
}

function objectRef(dict: string, key: string): number {
  const id = new RegExp(`/${key} (\\d+) 0 R`).exec(dict)?.[1];
  if (id === undefined) throw new Error(`No /${key} in ${dict}`);
  return Number(id);
}

function pageOf(objects: Map<number, PdfObject>): PdfObject {
  const page = [...objects.values()].find((o) =>
    o.dict.includes("/Type /Page "),
  );
  if (!page) throw new Error("No page");
  return page;
}

function contentOf(objects: Map<number, PdfObject>): string {
  const content = objects.get(objectRef(pageOf(objects).dict, "Contents"));
  return Buffer.from(content!.stream!).toString("latin1");
}

interface ShownText {
  font: string;
  size: number;
  text: string;
}

/** Decodes each shown string through its font's ToUnicode map. */
function shownText(bytes: Uint8Array): ShownText[] {
  const { objects } = parsePdf(bytes);
  const resources = pageOf(objects).dict;
  const shown: ShownText[] = [];
  for (const m of contentOf(objects).matchAll(
    /\/(F\d+) ([\d.]+) Tf[\s\S]*?<([0-9A-F]*)> Tj/g,
  )) {
    const font = objects.get(objectRef(resources, m[1]!))!;
    const cmap = Buffer.from(
      objects.get(objectRef(font.dict, "ToUnicode"))!.stream!,
    ).toString("latin1");
    const map = new Map(
      [...cmap.matchAll(/<([0-9A-F]{4})> <([0-9A-F]+)>/g)].map((e) => [
        e[1]!,
        String.fromCodePoint(
          ...e[2]!.match(/.{4}/g)!.map((unit) => parseInt(unit, 16)),
        ),
      ]),
    );
    shown.push({
      font: /\/BaseFont \/(\S+)/.exec(font.dict)![1]!,
      size: Number(m[2]),
      text: m[3]!
        .match(/.{4}/g)!
        .map((gid) => map.get(gid) ?? "?")
        .join(""),
    });
  }
  return shown;
}

/** The embedded font programs, inflated. */
function embeddedFonts(bytes: Uint8Array): Uint8Array[] {
  const { objects } = parsePdf(bytes);
  return [...objects.values()]
    .filter((o) => o.dict.includes("/Type /FontDescriptor"))
    .map((o) => objects.get(objectRef(o.dict, "FontFile2"))!.stream!);
}

function svg(body: string, attributes = 'width="7in" height="3.5in"'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" ${attributes}>${body}</svg>`;
}

describe("svgToPdf", () => {
  it("writes a PDF whose cross-reference table points at each object", async () => {
    const bytes = await svgToPdf(svg(""), FONTS);
    const { text, objects } = parsePdf(bytes);

    expect(text.startsWith("%PDF-1.7\n")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);

    const start = Number(/startxref\n(\d+)\n%%EOF/.exec(text)?.[1]);
    expect(text.slice(start, start + 4)).toBe("xref");
    const entries = [
      ...text.slice(start).matchAll(/^(\d{10}) 00000 n $/gm),
    ].map((m) => Number(m[1]));
    expect(entries).toHaveLength(objects.size);
    entries.forEach((offset, i) => {
      expect(text.slice(offset).startsWith(`${i + 1} 0 obj\n`)).toBe(true);
    });
  });

  it("sizes the page from the svg width and height in inches", async () => {
    const { text } = parsePdf(await svgToPdf(svg(""), FONTS));
    expect(text).toContain("/MediaBox [0 0 504 252]");
  });

  describe("shapes", () => {
    async function drawn(body: string): Promise<string> {
      const { objects } = parsePdf(await svgToPdf(svg(body), FONTS));
      return contentOf(objects);
    }

    it("flips the viewBox onto the page with y pointing down", async () => {
      expect(await drawn("")).toMatch(/^0\.7875 0 0 -0\.7875 0 252 cm/);
    });

    it("strokes a line in its colour and width", async () => {
      expect(
        await drawn(
          '<line x1="10" y1="20" x2="30" y2="40" stroke="#0072b2" stroke-width="2"/>',
        ),
      ).toContain("q 0 0.447 0.698 RG 2 w 10 20 m 30 40 l S Q");
    });

    it("fills a rect, painting black by default as SVG does", async () => {
      expect(
        await drawn('<rect x="1" y="2" width="30" height="4"/>'),
      ).toContain("q 0 0 0 rg 1 2 30 4 re f Q");
    });

    it("rounds rect corners, clamping each radius to half its side", async () => {
      const ops = await drawn(
        '<rect x="0" y="0" width="20" height="6" rx="5" fill="#000"/>',
      );
      // ry follows rx, then clamps to 3 on a 6 tall bar while rx stays 5
      expect(ops).toContain("q 0 0 0 rg 5 0 m 15 0 l");
      expect(ops).toContain("20 3 c 20 3 l");
      expect(ops.match(/ c /g)).toHaveLength(4);
      expect(ops).toMatch(/h f Q/);
    });

    it("starts a new subpath where a closed one began", async () => {
      expect(
        await drawn('<path d="M5 5l5 0Zl0 5" fill="none" stroke="#000"/>'),
      ).toContain("5 5 m 10 5 l h 5 5 m 5 10 l S");
    });

    it("reads exponents in either case", async () => {
      expect(
        await drawn('<path d="M1E1 0L2e1 0" fill="none" stroke="#000"/>'),
      ).toContain("10 0 m 20 0 l S");
    });

    it("strokes solid when every dash is zero, as SVG does", async () => {
      const ops = await drawn(
        '<line x2="5" stroke="#000" stroke-dasharray="0 0"/>',
      );
      expect(ops).toContain("q 0 0 0 RG 1 w 0 0 m 5 0 l S Q");
    });

    it("draws relative and absolute path commands as absolute points", async () => {
      expect(
        await drawn(
          '<path d="M10,10h20v5l-5,5L1e1 20Z" fill="none" stroke="#000"/>',
        ),
      ).toContain("10 10 m 30 10 l 30 15 l 25 20 l 10 20 l h S");
    });

    it("draws curves, mirroring the control point of a smooth curve", async () => {
      expect(
        await drawn(
          '<path d="M0 0C0 10 10 10 10 0s10-10 10 0" fill="none" stroke="#000"/>',
        ),
      ).toContain("0 0 m 0 10 10 10 10 0 c 10 -10 20 -10 20 0 c S");
    });

    it("raises quadratic curves to cubic ones", async () => {
      expect(
        await drawn('<path d="M0 0Q15 30 30 0" fill="none" stroke="#000"/>'),
      ).toContain("0 0 m 10 20 20 20 30 0 c S");
    });

    it("fills and strokes a circle drawn as four curves", async () => {
      const ops = await drawn(
        '<circle cx="50" cy="40" r="10" fill="#ffffff" stroke="#000000"/>',
      );
      expect(ops).toContain("60 40 m");
      expect(ops.match(/ c /g)).toHaveLength(4);
      expect(ops).toMatch(/h B Q/);
    });

    it("keeps dash patterns, caps and joins to their own element", async () => {
      const ops = await drawn(
        '<path d="M0 0L9 9" stroke="#000" stroke-dasharray="7 5" stroke-linecap="round" stroke-linejoin="round"/><line x2="5" stroke="#000"/>',
      );
      expect(ops).toContain("[7 5] 0 d 1 J 1 j");
      expect(ops).toContain("q 0 0 0 RG 1 w 0 0 m 5 0 l S Q");
    });

    it("inherits paint from the enclosing group", async () => {
      expect(
        await drawn(
          '<g stroke="#ffffff" stroke-width="3"><rect width="5" height="2"/></g>',
        ),
      ).toContain("q 0 0 0 rg 1 1 1 RG 3 w 0 0 5 2 re B Q");
    });

    it("applies opacity through a graphics state", async () => {
      const bytes = await svgToPdf(
        svg(
          '<rect width="5" height="5" fill="#000" fill-opacity="0.2"/><rect width="5" height="5" fill="#000" opacity="0.5" fill-opacity="0.5"/>',
        ),
        FONTS,
      );
      const { objects } = parsePdf(bytes);
      const ops = contentOf(objects);
      expect(ops).toContain("q /GS1 gs 0 0 0 rg");
      expect(ops).toContain("q /GS2 gs 0 0 0 rg");
      const page = pageOf(objects).dict;
      expect(page).toMatch(/\/GS1 << \/ca 0\.2 \/CA 1 >>/);
      expect(page).toMatch(/\/GS2 << \/ca 0\.25 \/CA 0\.5 >>/);
    });
  });

  describe("unsupported SVG", () => {
    it.each([
      ['<image href="x.png"/>', "<image>"],
      ['<g transform="scale(2)"/>', "transform"],
      ['<rect width="1" height="1" fill="url(#g)"/>', "url(#g)"],
      ['<path d="M0 0A5 5 0 0 1 9 9"/>', "path command A"],
      ['<text x="0" y="0">漢</text>', "no glyph for 漢"],
      ['<svg viewBox="0 0 1 1"/>', "nested <svg>"],
      [
        '<rect width="1" height="1" fill="#000" stroke="#000" opacity="0.5"/>',
        "opacity on a filled and stroked shape",
      ],
      ['<text x="0" y="0" style="font-style: italic">a</text>', "style"],
    ])("refuses %s instead of drawing it wrongly", async (body, named) => {
      await expect(svgToPdf(svg(body), FONTS)).rejects.toThrow(named);
    });

    it("accepts the tabular numbers style, which this font draws anyway", async () => {
      await expect(
        svgToPdf(
          svg(
            '<text x="0" y="0" style="font-variant-numeric: tabular-nums">1</text>',
          ),
          FONTS,
        ),
      ).resolves.toBeInstanceOf(Uint8Array);
    });
  });

  describe("text", () => {
    it("keeps labels as text a reader can extract, minus signs included", async () => {
      const bytes = await svgToPdf(
        svg('<text x="10" y="20" font-size="11">Week −3 (p &lt; 0.001)</text>'),
        FONTS,
      );
      expect(shownText(bytes)).toEqual([
        { font: "LiberationSans", size: 11, text: "Week −3 (p < 0.001)" },
      ]);
    });

    it("embeds the whole regular font, and only it when nothing is bold", async () => {
      const bytes = await svgToPdf(
        svg('<text x="0" y="9">n = 4</text>'),
        FONTS,
      );
      const fonts = embeddedFonts(bytes);
      expect(fonts).toHaveLength(1);
      expect(Buffer.from(fonts[0]!).equals(Buffer.from(FONTS.regular))).toBe(
        true,
      );
    });

    it("sets bold text in the embedded bold font", async () => {
      const bytes = await svgToPdf(
        svg(
          '<text x="0" y="9" font-weight="700">Unpublished</text><text x="0" y="30">n = 4</text>',
        ),
        FONTS,
      );
      expect(shownText(bytes).map(({ font, text }) => [font, text])).toEqual([
        ["LiberationSans-Bold", "Unpublished"],
        ["LiberationSans", "n = 4"],
      ]);
      expect(embeddedFonts(bytes)).toHaveLength(2);
    });

    it.each([
      ["start", 100],
      // A digit is 1139/2048 em wide in Arial-metric fonts: two at 10 units
      ["middle", 94.438],
      ["end", 88.877],
    ])("places %s-anchored text by its measured width", async (anchor, x) => {
      const bytes = await svgToPdf(
        svg(
          `<text x="100" y="50" font-size="10" text-anchor="${anchor}">00</text>`,
        ),
        FONTS,
      );
      const { objects } = parsePdf(bytes);
      expect(contentOf(objects)).toContain(`1 0 0 -1 ${x} 50 Tm`);
    });

    it("collapses whitespace the way SVG does", async () => {
      const bytes = await svgToPdf(
        svg('<text x="0" y="9">\n   a   b\t\n</text>'),
        FONTS,
      );
      expect(shownText(bytes).map((s) => s.text)).toEqual(["a b"]);
    });

    it("draws nothing for an empty label", async () => {
      const bytes = await svgToPdf(svg('<text x="0" y="9"></text>'), FONTS);
      expect(shownText(bytes)).toEqual([]);
      expect(embeddedFonts(bytes)).toHaveLength(0);
    });
  });
});
