/** The parts of a TrueType font that embedding and text layout need. */
export interface TrueTypeFont {
  bytes: Uint8Array;
  postScriptName: string;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  capHeight: number;
  bbox: [number, number, number, number];
  /** Glyph id for a code point, 0 when the font has no glyph for it */
  glyphOf(codePoint: number): number;
  /** Advance width of a glyph in font units */
  advanceOf(glyph: number): number;
}

type Tables = Map<string, number>;

function tablesOf(view: DataView): Tables {
  const tables: Tables = new Map();
  const count = view.getUint16(4);
  for (let i = 0; i < count; i++) {
    const record = 12 + 16 * i;
    const tag = String.fromCharCode(
      ...[0, 1, 2, 3].map((k) => view.getUint8(record + k)),
    );
    tables.set(tag, view.getUint32(record + 8));
  }
  return tables;
}

function table(tables: Tables, tag: string): number {
  const offset = tables.get(tag);
  if (offset === undefined) throw new Error(`Font has no ${tag} table`);
  return offset;
}

/** Reads the PostScript name (name id 6) from the Windows or Mac record. */
function postScriptNameOf(view: DataView, start: number): string {
  const count = view.getUint16(start + 2);
  const strings = start + view.getUint16(start + 4);
  for (let i = 0; i < count; i++) {
    const record = start + 6 + 12 * i;
    const platform = view.getUint16(record);
    if (view.getUint16(record + 6) !== 6) continue;
    const length = view.getUint16(record + 8);
    const offset = strings + view.getUint16(record + 10);
    if (platform === 3) {
      const units: number[] = [];
      for (let k = 0; k < length; k += 2)
        units.push(view.getUint16(offset + k));
      return String.fromCharCode(...units);
    }
    if (platform === 1) {
      const bytes: number[] = [];
      for (let k = 0; k < length; k++) bytes.push(view.getUint8(offset + k));
      return String.fromCharCode(...bytes);
    }
  }
  throw new Error("Font has no PostScript name");
}

/** Finds the Windows Unicode BMP subtable, which uses format 4. */
function unicodeCmap(view: DataView, start: number): number {
  const count = view.getUint16(start + 2);
  for (let i = 0; i < count; i++) {
    const record = start + 4 + 8 * i;
    const subtable = start + view.getUint32(record + 4);
    if (
      view.getUint16(record) === 3 &&
      view.getUint16(record + 2) === 1 &&
      view.getUint16(subtable) === 4
    ) {
      return subtable;
    }
  }
  throw new Error("Font has no Unicode cmap");
}

function format4Lookup(view: DataView, cmap: number): (code: number) => number {
  const segments = view.getUint16(cmap + 6) / 2;
  const ends = cmap + 14;
  const starts = ends + 2 * segments + 2;
  const deltas = starts + 2 * segments;
  const ranges = deltas + 2 * segments;
  return (code) => {
    if (code > 0xffff) return 0;
    for (let i = 0; i < segments; i++) {
      if (code > view.getUint16(ends + 2 * i)) continue;
      const first = view.getUint16(starts + 2 * i);
      if (code < first) return 0;
      const delta = view.getInt16(deltas + 2 * i);
      const rangeAt = ranges + 2 * i;
      const range = view.getUint16(rangeAt);
      if (range === 0) return (code + delta) & 0xffff;
      const glyph = view.getUint16(rangeAt + range + 2 * (code - first));
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };
}

export function parseTrueType(bytes: Uint8Array): TrueTypeFont {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x00010000) {
    throw new Error("Not a TrueType font");
  }
  const tables = tablesOf(view);
  const head = table(tables, "head");
  const hhea = table(tables, "hhea");
  const hmtx = table(tables, "hmtx");
  const os2 = table(tables, "OS/2");
  if (view.getUint16(os2 + 8) & 0x0002) {
    throw new Error("Font licence does not allow embedding");
  }
  const metrics = view.getUint16(hhea + 34);
  const lookup = format4Lookup(view, unicodeCmap(view, table(tables, "cmap")));

  return {
    bytes,
    postScriptName: postScriptNameOf(view, table(tables, "name")),
    unitsPerEm: view.getUint16(head + 18),
    ascent: view.getInt16(hhea + 4),
    descent: view.getInt16(hhea + 6),
    capHeight: view.getUint16(os2) >= 2 ? view.getInt16(os2 + 88) : 0,
    bbox: [36, 38, 40, 42].map((k) => view.getInt16(head + k)) as [
      number,
      number,
      number,
      number,
    ],
    glyphOf: lookup,
    advanceOf: (glyph) =>
      view.getUint16(hmtx + 4 * Math.min(glyph, metrics - 1)),
  };
}
