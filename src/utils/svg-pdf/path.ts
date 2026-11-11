import { num } from "./format";

const TOKEN =
  /([MLHVCSQTZmlhvcsqtz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)|([^\s,])/g;

/** How many numbers each command takes per repetition. */
const ARITY: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  Z: 0,
};

function tokenize(d: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  for (const [, command, value, other] of d.matchAll(TOKEN)) {
    if (other !== undefined)
      throw new Error(`Unsupported path command ${other}`);
    tokens.push(command ?? Number(value));
  }
  return tokens;
}

/** Translates SVG path data into PDF path operators in the same units. */
export function pathOps(d: string): string {
  const tokens = tokenize(d);
  const ops: string[] = [];
  const point = (x: number, y: number): string => `${num(x)} ${num(y)}`;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // The last control point, which smooth curves mirror
  let controlX = 0;
  let controlY = 0;
  let previous = "";
  let i = 0;

  while (i < tokens.length) {
    const command = tokens[i++];
    if (typeof command !== "string") {
      throw new Error("Path data must start with a command");
    }
    const upper = command.toUpperCase();
    const relative = command !== upper;
    const arity = ARITY[upper]!;
    let first = true;

    do {
      const args: number[] = [];
      for (let k = 0; k < arity; k++) {
        const value = tokens[i++];
        if (typeof value !== "number") {
          throw new Error(`Path command ${command} needs ${arity} numbers`);
        }
        args.push(value);
      }
      const dx = relative ? x : 0;
      const dy = relative ? y : 0;
      // A smooth curve mirrors the last control point, or starts at the point
      const mirrored = (follows: boolean): [number, number] =>
        follows ? [2 * x - controlX, 2 * y - controlY] : [x, y];
      const smooth = previous === "C" || previous === "S";
      const smoothQuad = previous === "Q" || previous === "T";
      let kind = upper;

      if (upper === "M" && first) {
        x = args[0]! + dx;
        y = args[1]! + dy;
        startX = x;
        startY = y;
        ops.push(`${point(x, y)} m`);
      } else if (
        upper === "M" ||
        upper === "L" ||
        upper === "H" ||
        upper === "V"
      ) {
        // Pairs after a move are lines
        kind = "L";
        if (upper === "H") x = args[0]! + dx;
        else if (upper === "V") y = args[0]! + dy;
        else {
          x = args[0]! + dx;
          y = args[1]! + dy;
        }
        ops.push(`${point(x, y)} l`);
      } else if (upper === "C" || upper === "S") {
        const [x1, y1] =
          upper === "C" ? [args[0]! + dx, args[1]! + dy] : mirrored(smooth);
        const rest = upper === "C" ? args.slice(2) : args;
        controlX = rest[0]! + dx;
        controlY = rest[1]! + dy;
        const endX = rest[2]! + dx;
        const endY = rest[3]! + dy;
        ops.push(
          `${point(x1, y1)} ${point(controlX, controlY)} ${point(endX, endY)} c`,
        );
        x = endX;
        y = endY;
      } else if (upper === "Q" || upper === "T") {
        const [qx, qy] =
          upper === "Q" ? [args[0]! + dx, args[1]! + dy] : mirrored(smoothQuad);
        const end = upper === "Q" ? args.slice(2) : args;
        const endX = end[0]! + dx;
        const endY = end[1]! + dy;
        // A quadratic curve is a cubic one with controls two thirds along
        ops.push(
          `${point(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y))} ${point(endX + (2 / 3) * (qx - endX), endY + (2 / 3) * (qy - endY))} ${point(endX, endY)} c`,
        );
        controlX = qx;
        controlY = qy;
        x = endX;
        y = endY;
      } else {
        ops.push("h");
        x = startX;
        y = startY;
      }
      previous = kind;
      first = false;
    } while (arity > 0 && typeof tokens[i] === "number");
  }
  return ops.join(" ");
}
