import chartCss from "./experiment-chart.css?raw";

const FONT_FAMILY = "Helvetica, Arial, sans-serif";
const SVG_NS = "http://www.w3.org/2000/svg";

/** Reads the light theme chart tokens, so exports look the same in dark mode. */
function lightTokens(): Map<string, string> {
  const block = /^\.exp-viz\s*\{([^}]*)\}/m.exec(chartCss)?.[1] ?? "";
  return new Map(
    [...block.matchAll(/(--viz-[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1]!,
      m[2]!.trim(),
    ]),
  );
}

function resolveTokens(value: string, tokens: Map<string, string>): string {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const resolved = tokens.get(name);
    if (resolved === undefined) throw new Error(`Unknown chart token ${name}`);
    return resolved;
  });
}

/** Removes marked interactive elements and comments, keeping the rest. */
function dropNonFigureNodes(root: Element): void {
  for (const element of root.querySelectorAll("[data-export-omit]")) {
    element.remove();
  }
  const comments = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
  const found: Node[] = [];
  while (comments.nextNode()) found.push(comments.referenceNode);
  for (const comment of found) comment.parentNode?.removeChild(comment);
}

function cleanElement(element: Element, tokens: Map<string, string>): void {
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

/** Serialises a rendered chart into an SVG file that needs no page CSS. */
export function standaloneSvg(chart: SVGSVGElement): string {
  const tokens = lightTokens();
  const svg = chart.cloneNode(true) as SVGSVGElement;
  dropNonFigureNodes(svg);
  cleanElement(svg, tokens);

  const [minX, minY, width, height] = (svg.getAttribute("viewBox") ?? "").split(
    " ",
  );
  svg.setAttribute("width", width ?? "");
  svg.setAttribute("height", height ?? "");
  svg.setAttribute("font-family", FONT_FAMILY);

  // Keeps the figure readable in dark viewers
  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", minX ?? "0");
  background.setAttribute("y", minY ?? "0");
  background.setAttribute("width", width ?? "");
  background.setAttribute("height", height ?? "");
  background.setAttribute("fill", resolveTokens("var(--viz-surface)", tokens));
  svg.prepend(background);

  return new XMLSerializer().serializeToString(svg);
}

export type CsvValue = number | string | null;

export interface ChartData {
  columns: string[];
  rows: CsvValue[][];
}

function csvCell(value: CsvValue): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Writes the plotted values as CSV, with nulls left empty. */
export function chartDataCsv({ columns, rows }: ChartData): string {
  return [columns, ...rows]
    .map((row) => `${row.map(csvCell).join(",")}\n`)
    .join("");
}
