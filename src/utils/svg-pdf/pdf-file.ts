const encoder = new TextEncoder();

/** Bytes as a latin1 string, so binary survives string building. */
function latin1(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return text;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const compression = new CompressionStream("deflate");
  const writer = compression.writable.getWriter();
  void writer.write(bytes as BufferSource);
  void writer.close();
  return new Uint8Array(await new Response(compression.readable).arrayBuffer());
}

interface Entry {
  dict: string;
  stream?: Uint8Array;
}

/** Collects numbered objects and writes them as one PDF file. */
export class PdfFile {
  private readonly entries: (Entry | undefined)[] = [];

  /** Reserves an object number, to refer to before the object is set. */
  reserve(): number {
    this.entries.push(undefined);
    return this.entries.length;
  }

  set(id: number, dict: string): void {
    this.entries[id - 1] = { dict };
  }

  add(dict: string): number {
    const id = this.reserve();
    this.set(id, dict);
    return id;
  }

  /** Adds a compressed stream; `extra` holds more dictionary entries. */
  async addStream(data: Uint8Array | string, extra = ""): Promise<number> {
    const raw = typeof data === "string" ? encoder.encode(data) : data;
    const packed = await deflate(raw);
    const id = this.reserve();
    this.entries[id - 1] = {
      dict: `<< /Length ${packed.length} /Filter /FlateDecode${extra} >>`,
      stream: packed,
    };
    return id;
  }

  write(rootId: number): Uint8Array {
    // The binary comment tells tools the file holds 8-bit data
    let out = "%PDF-1.7\n%\xe2\xe3\xcf\xd3\n";
    const offsets: number[] = [];
    this.entries.forEach((entry, i) => {
      if (!entry) throw new Error(`PDF object ${i + 1} was never set`);
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${entry.dict}\n`;
      if (entry.stream) out += `stream\n${latin1(entry.stream)}\nendstream\n`;
      out += "endobj\n";
    });
    const start = out.length;
    out += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      out += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${offsets.length + 1} /Root ${rootId} 0 R >>\n`;
    out += `startxref\n${start}\n%%EOF\n`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i);
    return bytes;
  }
}
