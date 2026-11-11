import type { FontSet } from "./font-set";
import { num } from "./format";
import { pathOps } from "./path";
import type { TrueTypeFont } from "./truetype";

/** Painting properties that children inherit, as in SVG. */
interface Style {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeOpacity: number;
  strokeWidth: number;
  dash: string;
  cap: string;
  join: string;
  fontSize: number;
  bold: boolean;
  anchor: "start" | "middle" | "end";
}

const DEFAULT_STYLE: Style = {
  fill: "#000000",
  fillOpacity: 1,
  stroke: "none",
  strokeOpacity: 1,
  strokeWidth: 1,
  dash: "none",
  cap: "butt",
  join: "miter",
  fontSize: 16,
  bold: false,
  anchor: "start",
};

const CAPS: Record<string, string> = { butt: "0", round: "1", square: "2" };
const JOINS: Record<string, string> = { miter: "0", round: "1", bevel: "2" };

/** Attributes every element may carry; anything else is refused. */
const PAINT_ATTRIBUTES = new Set([
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "font-size",
  "font-weight",
  "font-family",
  "text-anchor",
  "style",
  "id",
  "role",
]);

const GEOMETRY: Record<string, string[]> = {
  svg: ["viewBox", "width", "height", "xmlns"],
  g: [],
  text: ["x", "y", "opacity"],
  line: ["x1", "y1", "x2", "y2", "opacity"],
  rect: ["x", "y", "width", "height", "rx", "ry", "opacity"],
  circle: ["cx", "cy", "r", "opacity"],
  path: ["d", "opacity"],
};

/** Styles that change nothing in this font, so they may stay. */
const IGNORED_STYLES = new Set(["font-variant-numeric: tabular-nums"]);

/** What a whole page shares while it is drawn. */
export interface RenderContext {
  regular: TrueTypeFont;
  bold: TrueTypeFont;
  fonts: FontSet;
  /** Graphics state name by "fill stroke" opacity pair */
  opacities: Map<string, string>;
}

function numberAttr(element: Element, name: string): number {
  const value = Number(element.getAttribute(name) ?? 0);
  if (!Number.isFinite(value)) {
    throw new Error(`<${element.localName}> has a non-numeric ${name}`);
  }
  return value;
}

/** A colour as PDF RGB components, or null for no paint. */
function rgb(color: string): string | null {
  if (color === "none" || color === "transparent") return null;
  let hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) throw new Error(`Unsupported colour ${color}`);
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
  return [0, 2, 4]
    .map((i) => num(parseInt(hex.slice(i, i + 2), 16) / 255))
    .join(" ");
}

function checkAttributes(element: Element): void {
  const own = GEOMETRY[element.localName] ?? [];
  for (const { name, value } of element.attributes) {
    const known =
      PAINT_ATTRIBUTES.has(name) ||
      own.includes(name) ||
      name.startsWith("aria-") ||
      name.startsWith("xmlns:");
    if (!known) {
      throw new Error(
        `Unsupported attribute ${name} on <${element.localName}>`,
      );
    }
    if (name === "style") {
      for (const rule of value.split(";").map((r) => r.trim())) {
        if (rule && !IGNORED_STYLES.has(rule.replace(/\s+/g, " "))) {
          throw new Error(`Unsupported style ${rule}`);
        }
      }
    }
  }
}

function inherit(element: Element, parent: Style): Style {
  const style = { ...parent };
  const text = (name: string): string | null => element.getAttribute(name);
  style.fill = text("fill") ?? style.fill;
  style.stroke = text("stroke") ?? style.stroke;
  style.dash = text("stroke-dasharray") ?? style.dash;
  style.cap = text("stroke-linecap") ?? style.cap;
  style.join = text("stroke-linejoin") ?? style.join;
  if (element.hasAttribute("fill-opacity")) {
    style.fillOpacity = numberAttr(element, "fill-opacity");
  }
  if (element.hasAttribute("stroke-opacity")) {
    style.strokeOpacity = numberAttr(element, "stroke-opacity");
  }
  if (element.hasAttribute("stroke-width")) {
    style.strokeWidth = numberAttr(element, "stroke-width");
  }
  if (element.hasAttribute("font-size")) {
    style.fontSize = numberAttr(element, "font-size");
  }
  const weight = text("font-weight");
  if (weight !== null) {
    style.bold = weight === "bold" || Number(weight) >= 600;
  }
  const anchor = text("text-anchor");
  if (anchor !== null) {
    if (anchor !== "start" && anchor !== "middle" && anchor !== "end") {
      throw new Error(`Unsupported text-anchor ${anchor}`);
    }
    style.anchor = anchor;
  }
  return style;
}

/** Selects a graphics state for the element's opacity, if it has any. */
function opacityOp(
  element: Element,
  style: Style,
  context: RenderContext,
): string[] {
  const opacity = element.hasAttribute("opacity")
    ? numberAttr(element, "opacity")
    : 1;
  const fill = num(opacity * style.fillOpacity);
  const stroke = num(opacity * style.strokeOpacity);
  if (fill === "1" && stroke === "1") return [];
  const key = `${fill} ${stroke}`;
  let name = context.opacities.get(key);
  if (!name) {
    name = `GS${context.opacities.size + 1}`;
    context.opacities.set(key, name);
  }
  return [`/${name} gs`];
}

function strokeOps(style: Style, paint: string): string[] {
  const ops = [`${paint} RG`, `${num(style.strokeWidth)} w`];
  if (style.dash !== "none") {
    const parts = style.dash.split(/[\s,]+/).map(Number);
    if (parts.some((p) => !Number.isFinite(p) || p < 0)) {
      throw new Error(`Unsupported stroke-dasharray ${style.dash}`);
    }
    ops.push(`[${parts.map(num).join(" ")}] 0 d`);
  }
  const cap = CAPS[style.cap];
  const join = JOINS[style.join];
  if (cap === undefined) throw new Error(`Unsupported linecap ${style.cap}`);
  if (join === undefined) throw new Error(`Unsupported linejoin ${style.join}`);
  if (cap !== "0") ops.push(`${cap} J`);
  if (join !== "0") ops.push(`${join} j`);
  return ops;
}

/** Paints a shape outline, filling it unless `fillable` is false. */
function paintShape(
  element: Element,
  style: Style,
  shape: string,
  context: RenderContext,
  out: string[],
  fillable = true,
): void {
  const fill = fillable ? rgb(style.fill) : null;
  const stroke = style.strokeWidth > 0 ? rgb(style.stroke) : null;
  if (fill === null && stroke === null) return;
  const ops = ["q", ...opacityOp(element, style, context)];
  if (fill !== null) ops.push(`${fill} rg`);
  if (stroke !== null) ops.push(...strokeOps(style, stroke));
  let paint = "B";
  if (fill === null) paint = "S";
  else if (stroke === null) paint = "f";
  out.push([...ops, shape, paint, "Q"].join(" "));
}

/** Control point distance of a cubic curve that fits a quarter circle */
const KAPPA = 0.5522847498;

/** Four cubic curves, the usual close fit to a circle. */
function circleShape(cx: number, cy: number, r: number): string {
  const k = KAPPA * r;
  const p = (x: number, y: number): string => `${num(x)} ${num(y)}`;
  return [
    `${p(cx + r, cy)} m`,
    `${p(cx + r, cy + k)} ${p(cx + k, cy + r)} ${p(cx, cy + r)} c`,
    `${p(cx - k, cy + r)} ${p(cx - r, cy + k)} ${p(cx - r, cy)} c`,
    `${p(cx - r, cy - k)} ${p(cx - k, cy - r)} ${p(cx, cy - r)} c`,
    `${p(cx + k, cy - r)} ${p(cx + r, cy - k)} ${p(cx + r, cy)} c`,
    "h",
  ].join(" ");
}

/** A rect, with corners rounded as SVG rounds them when rx or ry is set. */
function rectShape(element: Element): string {
  const n = (name: string): number => numberAttr(element, name);
  const [x, y, w, h] = [n("x"), n("y"), n("width"), n("height")];
  // A missing radius takes the other one, as in SVG
  const radius = (own: string, other: string): number =>
    n(element.hasAttribute(own) ? own : other);
  const rx = Math.min(radius("rx", "ry"), w / 2);
  const ry = Math.min(radius("ry", "rx"), h / 2);
  const p = (px: number, py: number): string => `${num(px)} ${num(py)}`;
  if (rx <= 0 || ry <= 0) return `${p(x, y)} ${p(w, h)} re`;
  const kx = (1 - KAPPA) * rx;
  const ky = (1 - KAPPA) * ry;
  return [
    `${p(x + rx, y)} m ${p(x + w - rx, y)} l`,
    `${p(x + w - kx, y)} ${p(x + w, y + ky)} ${p(x + w, y + ry)} c ${p(x + w, y + h - ry)} l`,
    `${p(x + w, y + h - ky)} ${p(x + w - kx, y + h)} ${p(x + w - rx, y + h)} c ${p(x + rx, y + h)} l`,
    `${p(x + kx, y + h)} ${p(x, y + h - ky)} ${p(x, y + h - ry)} c ${p(x, y + ry)} l`,
    `${p(x, y + ky)} ${p(x + kx, y)} ${p(x + rx, y)} c h`,
  ].join(" ");
}

/** SVG's default whitespace handling: no newlines, single spaces, trimmed. */
function labelOf(element: Element): string {
  return (element.textContent ?? "")
    .replace(/[\r\n]/g, "")
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function drawText(
  element: Element,
  style: Style,
  context: RenderContext,
  out: string[],
): void {
  if (element.children.length > 0) {
    throw new Error("Unsupported SVG element inside <text>");
  }
  if (rgb(style.stroke) !== null) throw new Error("Unsupported stroked text");
  const label = labelOf(element);
  const paint = rgb(style.fill);
  if (label === "" || paint === null) return;
  const font = style.bold ? context.bold : context.regular;
  const { name, hex, width } = context.fonts.encode(font, label);
  const shift = { start: 0, middle: 0.5, end: 1 }[style.anchor];
  const x = numberAttr(element, "x") - shift * width * style.fontSize;
  const y = numberAttr(element, "y");
  // The page is flipped to SVG's y-down, so the text matrix flips it back
  out.push(
    [
      "q",
      ...opacityOp(element, style, context),
      `${paint} rg BT /${name} ${num(style.fontSize)} Tf 1 0 0 -1 ${num(x)} ${num(y)} Tm <${hex}> Tj ET Q`,
    ].join(" "),
  );
}

/** Appends the drawing operators for `element` and its children. */
export function renderElement(
  element: Element,
  parent: Style | null,
  context: RenderContext,
  out: string[],
): void {
  const name = element.localName;
  if (name === "title" || name === "desc") return;
  if (!(name in GEOMETRY)) {
    throw new Error(`Unsupported SVG element <${name}>`);
  }
  checkAttributes(element);
  const style = inherit(element, parent ?? DEFAULT_STYLE);
  const n = (attribute: string): number => numberAttr(element, attribute);

  switch (name) {
    case "svg":
    case "g":
      for (const child of element.children) {
        renderElement(child, style, context, out);
      }
      return;
    case "text":
      drawText(element, style, context, out);
      return;
    case "line":
      paintShape(
        element,
        style,
        `${num(n("x1"))} ${num(n("y1"))} m ${num(n("x2"))} ${num(n("y2"))} l`,
        context,
        out,
        false,
      );
      return;
    case "rect":
      if (n("width") <= 0 || n("height") <= 0) return;
      paintShape(element, style, rectShape(element), context, out);
      return;
    case "circle":
      if (n("r") <= 0) return;
      paintShape(
        element,
        style,
        circleShape(n("cx"), n("cy"), n("r")),
        context,
        out,
      );
      return;
    case "path": {
      const shape = pathOps(element.getAttribute("d") ?? "");
      if (shape !== "") paintShape(element, style, shape, context, out);
      return;
    }
    default:
      throw new Error(`Unsupported SVG element <${name}>`);
  }
}
