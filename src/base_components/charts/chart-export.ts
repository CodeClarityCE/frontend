import tokenCss from "@/assets/main.css?raw";

import chartCss from "./chart.css?raw";
import { type ChartMarks, chartMarkText } from "./chart-caption";

const FONT_FAMILY = "Helvetica, Arial, sans-serif";
const SVG_NS = "http://www.w3.org/2000/svg";
const PNG_DPI = 300;
const INCHES_PER_METRE = 39.3701;

/** Journal column widths; each is laid out so labels print at about 8.7 pt. */
export const EXPORT_PRESETS = {
  single: { label: "Single column (3.5 in)", inches: 3.5, layoutWidth: 320 },
  double: { label: "Double column (7 in)", inches: 7, layoutWidth: 640 },
} as const;

export type ExportPreset = keyof typeof EXPORT_PRESETS;

/** Line patterns by series token, so series differ without colour. */
const SERIES_DASH: Record<string, string> = {
  "2": "7 5",
  "3": "1 5",
  "4": "9 3 1 3",
  "5": "3 3",
  "6": "1 3 5 3",
};

function tokensOf(css: string, block: RegExp): [string, string][] {
  const body = block.exec(css)?.[1] ?? "";
  return [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]);
}

/** The light tokens and chart roles with the print overrides, in any theme. */
function printTokens(): Map<string, string> {
  return new Map([
    ...tokensOf(tokenCss, /:root\s*\{([^}]*)\}/),
    ...tokensOf(chartCss, /^\.chart-viz\s*\{([^}]*)\}/m),
    ...tokensOf(chartCss, /^\.chart-viz-print\s*\{([^}]*)\}/m),
  ]);
}

/** Replaces each var() with its value, following roles down to the token. */
function resolveTokens(value: string, tokens: Map<string, string>): string {
  let resolved = value;
  for (let depth = 0; depth < 8 && resolved.includes("var("); depth++) {
    resolved = resolved.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
      const found = tokens.get(name);
      if (found === undefined) throw new Error(`Unknown chart token ${name}`);
      return found;
    });
  }
  return resolved;
}

/** Removes marked interactive elements and comments, keeping the rest. */
function dropNonChartNodes(root: Element): void {
  for (const element of root.querySelectorAll("[data-export-omit]")) {
    element.remove();
  }
  const comments = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
  const found: Node[] = [];
  while (comments.nextNode()) found.push(comments.referenceNode);
  for (const comment of found) comment.parentNode?.removeChild(comment);
}

/** Outlines a filled bar, so its pattern shows without colour. */
function outlineBar(element: Element): void {
  const series = /^var\(--viz-series-(\d)\)$/.exec(
    element.getAttribute("fill") ?? "",
  )?.[1];
  if (!series || element.hasAttribute("stroke")) return;
  element.setAttribute("stroke", "var(--viz-text-primary)");
  element.setAttribute("stroke-width", "1");
  const dash = SERIES_DASH[series];
  if (dash) element.setAttribute("stroke-dasharray", dash);
}

function addSeriesDash(element: Element): void {
  if (element.localName === "path") outlineBar(element);
  if (element.localName !== "path" && element.localName !== "line") return;
  const series = /^var\(--viz-series-(\d)\)$/.exec(
    element.getAttribute("stroke") ?? "",
  )?.[1];
  const dash = series ? SERIES_DASH[series] : undefined;
  if (dash) element.setAttribute("stroke-dasharray", dash);
}

function cleanElement(element: Element, tokens: Map<string, string>): void {
  addSeriesDash(element);
  for (const attribute of [...element.attributes]) {
    if (
      attribute.name === "class" ||
      attribute.name === "tabindex" ||
      attribute.name.startsWith("data-")
    ) {
      element.removeAttribute(attribute.name);
    } else {
      attribute.value = resolveTokens(attribute.value, tokens);
    }
  }
  for (const child of [...element.children]) cleanElement(child, tokens);
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function viewBoxOf(svg: SVGSVGElement): ViewBox {
  const [x, y, width, height] = (svg.getAttribute("viewBox") ?? "")
    .split(" ")
    .map(Number);
  return { x: x ?? 0, y: y ?? 0, width: width ?? 0, height: height ?? 0 };
}

function setViewBox(svg: SVGSVGElement, box: ViewBox): void {
  svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
}

function svgElement(name: string, attributes: Record<string, string>): Element {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/** One step that adds to the chart while it is assembled. */
type ChartStep = (
  svg: SVGSVGElement,
  source: HTMLElement,
  marks: ChartMarks,
) => void;

const LEGEND_FONT = 11;
const LEGEND_ROW = 16;
const SWATCH = 24;
/** Estimated label width per character, as there is no layout to measure */
const CHAR_WIDTH = LEGEND_FONT * 0.58;

/** Redraws a legend kept outside the svg, in rows above the plot. */
const addLegend: ChartStep = (svg, source) => {
  const entries = [...source.querySelectorAll("[data-export-legend] > *")].map(
    (item) => ({
      label: item.querySelector("span")?.textContent?.trim() ?? "",
      stroke: item.querySelector("line")?.getAttribute("stroke") ?? "",
      fill: item.querySelector("rect")?.getAttribute("fill") ?? null,
    }),
  );
  if (entries.length === 0) return;

  const box = viewBoxOf(svg);
  const placed: {
    label: string;
    stroke: string;
    fill: string | null;
    x: number;
    row: number;
  }[] = [];
  let row = 0;
  let x = 0;
  for (const entry of entries) {
    const width = SWATCH + 4 + entry.label.length * CHAR_WIDTH;
    if (x > 0 && x + width > box.width) {
      row += 1;
      x = 0;
    }
    placed.push({ ...entry, x, row });
    x += width + 14;
  }

  const height = (row + 1) * LEGEND_ROW + 4;
  const top = box.y - height;
  const group = svgElement("g", {});
  for (const item of placed) {
    const y = top + LEGEND_ROW * (item.row + 1) - 4;
    group.append(
      item.fill
        ? svgElement("path", {
            d: `M${box.x + item.x},${y - 9}h${SWATCH}v10h-${SWATCH}Z`,
            fill: item.fill,
          })
        : svgElement("line", {
            x1: String(box.x + item.x),
            x2: String(box.x + item.x + SWATCH),
            y1: String(y - 4),
            y2: String(y - 4),
            stroke: item.stroke,
            "stroke-width": "2",
          }),
    );
    const text = svgElement("text", {
      x: String(box.x + item.x + SWATCH + 4),
      y: String(y),
      "font-size": String(LEGEND_FONT),
      fill: "var(--viz-text-secondary)",
    });
    text.textContent = item.label;
    group.append(text);
  }
  svg.append(group);
  setViewBox(svg, { ...box, y: top, height: box.height + height });
};

/** States above the plot whether the chart is a draft or which version. */
const addMark: ChartStep = (svg, _source, marks) => {
  const mark = chartMarkText(marks);
  if (!mark) return;
  const box = viewBoxOf(svg);
  const height = LEGEND_ROW + 4;
  const top = box.y - height;
  const text = svgElement("text", {
    x: String(box.x),
    y: String(top + LEGEND_ROW - 4),
    "font-size": String(LEGEND_FONT),
    "font-weight": "700",
    fill: "var(--viz-text-secondary)",
  });
  text.textContent = mark;
  svg.append(text);
  setViewBox(svg, { ...box, y: top, height: box.height + height });
};

/** Keeps the chart readable in dark viewers. */
const addBackground: ChartStep = (svg) => {
  const { x, y, width, height } = viewBoxOf(svg);
  svg.prepend(
    svgElement("rect", {
      x: String(x),
      y: String(y),
      width: String(width),
      height: String(height),
      fill: "var(--viz-surface)",
    }),
  );
};

const CHART_STEPS: ChartStep[] = [addLegend, addMark, addBackground];

/** An assembled chart, ready to save as SVG or to rasterise. */
export interface StandaloneChart {
  svg: string;
  pixelWidth: number;
  pixelHeight: number;
}

/** Builds an SVG file needing no page CSS from the chart inside `source`. */
export function standaloneChart(
  source: HTMLElement,
  preset: ExportPreset,
  marks: ChartMarks = {},
): StandaloneChart | null {
  const chart = [...source.querySelectorAll("svg")].find(
    (candidate) => !candidate.closest("[data-export-legend]"),
  );
  if (!chart) return null;

  const svg = chart.cloneNode(true) as SVGSVGElement;
  dropNonChartNodes(svg);
  for (const step of CHART_STEPS) step(svg, source, marks);
  cleanElement(svg, printTokens());

  const { inches } = EXPORT_PRESETS[preset];
  const { width, height } = viewBoxOf(svg);
  const heightInches = (inches * height) / width;
  svg.setAttribute("width", `${inches}in`);
  svg.setAttribute("height", `${Number(heightInches.toFixed(3))}in`);
  svg.setAttribute("font-family", FONT_FAMILY);

  return {
    svg: new XMLSerializer().serializeToString(svg),
    pixelWidth: Math.round(inches * PNG_DPI),
    pixelHeight: Math.round(heightInches * PNG_DPI),
  };
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Adds the density chunk after the header, which canvases leave out. */
function withDensity(png: Uint8Array): Uint8Array {
  const AFTER_HEADER = 33;
  const perMetre = Math.round(PNG_DPI * INCHES_PER_METRE);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  view.setUint32(8, perMetre);
  view.setUint32(12, perMetre);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));

  const result = new Uint8Array(png.length + chunk.length);
  result.set(png.subarray(0, AFTER_HEADER));
  result.set(chunk, AFTER_HEADER);
  result.set(png.subarray(AFTER_HEADER), AFTER_HEADER + chunk.length);
  return result;
}

function loadImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not draw the chart"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Rasterises a chart to a PNG file at 300 dpi. */
export async function chartPng(chart: StandaloneChart): Promise<Blob> {
  const image = await loadImage(chart.svg);
  const canvas = document.createElement("canvas");
  canvas.width = chart.pixelWidth;
  canvas.height = chart.pixelHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) throw new Error("Could not encode the chart");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new Blob([withDensity(bytes) as BlobPart], { type: "image/png" });
}

export type CsvValue = number | string | null;

export interface ChartData {
  columns: string[];
  rows: CsvValue[][];
}

function csvCell(value: CsvValue): string {
  if (value === null) return "";
  // A leading quote stops spreadsheets running text as a formula
  const text =
    typeof value === "string" && /^[=+\-@\t\r]/.test(value)
      ? `'${value}`
      : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Writes the plotted values as CSV, with nulls left empty. */
export function chartDataCsv({ columns, rows }: ChartData): string {
  return [columns, ...rows]
    .map((row) => `${row.map(csvCell).join(",")}\n`)
    .join("");
}
