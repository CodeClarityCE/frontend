import { FontSet } from "./font-set";
import { num } from "./format";
import { PdfFile } from "./pdf-file";
import { type RenderContext, renderElement } from "./render";
import { parseTrueType } from "./truetype";

/** TrueType files for normal and bold text. */
export interface PdfFonts {
  regular: Uint8Array;
  bold: Uint8Array;
}

const POINTS_PER_INCH = 72;
/** SVG's default miter limit; PDF's own default is 10 */
const SVG_MITER_LIMIT = 4;

/** A length such as "7in" in points. */
function inchesToPoints(length: string | null): number {
  const match = /^([\d.]+)in$/.exec(length ?? "");
  if (!match) throw new Error(`SVG size must be in inches, got ${length}`);
  return Number(match[1]) * POINTS_PER_INCH;
}

function viewBoxOf(root: Element): [number, number, number, number] {
  const box = (root.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  if (box.length !== 4 || box.some((v) => !Number.isFinite(v)) || !box[2]) {
    throw new Error("SVG needs a viewBox");
  }
  return box as [number, number, number, number];
}

function opacityResources(opacities: Map<string, string>): string {
  if (opacities.size === 0) return "";
  const states = [...opacities].map(([key, name]) => {
    const [fill, stroke] = key.split(" ");
    return `/${name} << /ca ${fill} /CA ${stroke} >>`;
  });
  return `/ExtGState << ${states.join(" ")} >>`;
}

/** Converts a standalone figure SVG into a one-page vector PDF. */
export async function svgToPdf(
  svgText: string,
  fonts: PdfFonts,
): Promise<Uint8Array> {
  const root = new DOMParser().parseFromString(
    svgText,
    "image/svg+xml",
  ).documentElement;
  if (root.localName !== "svg") throw new Error("Not an SVG document");
  const width = inchesToPoints(root.getAttribute("width"));
  const height = inchesToPoints(root.getAttribute("height"));
  const [x, y, viewWidth] = viewBoxOf(root);
  const scale = width / viewWidth;

  const context: RenderContext = {
    regular: parseTrueType(fonts.regular),
    bold: parseTrueType(fonts.bold),
    fonts: new FontSet(),
    opacities: new Map(),
  };
  // Maps viewBox units onto the page, with y pointing down as in SVG
  const ops = [
    `${num(scale, 6)} 0 0 ${num(-scale, 6)} ${num(-x * scale, 6)} ${num(height + y * scale, 6)} cm ${SVG_MITER_LIMIT} M`,
  ];
  renderElement(root, null, context, ops);

  const file = new PdfFile();
  const catalog = file.reserve();
  const pages = file.reserve();
  const content = await file.addStream(ops.join("\n"));
  const resources = [
    await context.fonts.embed(file),
    opacityResources(context.opacities),
  ].filter(Boolean);
  const page = file.add(
    `<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${num(width)} ${num(height)}] /Contents ${content} 0 R /Resources << ${resources.join(" ")} >> >>`,
  );
  file.set(pages, `<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
  file.set(catalog, `<< /Type /Catalog /Pages ${pages} 0 R >>`);
  return file.write(catalog);
}
