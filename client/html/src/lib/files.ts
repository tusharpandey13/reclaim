/** Report files, made on the phone. No library and no network. Text-only PDF with a built-in font. That font has no ₹, so ₹ is one drawn glyph in a small font of its own. */

/** Neutralises spreadsheet formulas, and quotes as CSV needs. */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const csv = (rows: (string | number)[][]): string => `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;

const pdfText = (s: string): string =>
  s.replace(/[−–—]/g, '-').replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1');

/** One line's show-text operators, switching to the ₹ font and back. Each Tj moves on by its own width, so no width table is needed. */
const pdfShow = (s: string, face: string, size: number): string =>
  s.split('₹').map((part) => (part ? `(${pdfText(part)}) Tj` : '')).join(` /F3 ${size} Tf (R) Tj /${face} ${size} Tf `);

const RUPEE_GLYPH = '556 0 20 -20 540 740 d1 70 w 60 680 m 500 680 l S 60 490 m 500 490 l S 190 680 m 340 680 420 600 420 490 c 420 380 340 300 190 300 c 130 300 l S 190 300 m 420 0 l S';
const RUPEE_MAP = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /R def /CMapType 2 def 1 begincodespacerange <00> <FF> endcodespacerange 1 beginbfchar <52> <20B9> endbfchar endcmap CMapName currentdict /CMap defineresource pop end end';

/** pages: lines of text. A line starting with "# " is a heading. No metadata beyond what a reader sees. */
export function pdf(pages: string[][]) {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const glyph = add(`<< /Length ${RUPEE_GLYPH.length} >>\nstream\n${RUPEE_GLYPH}\nendstream`);
  const unicode = add(`<< /Length ${RUPEE_MAP.length} >>\nstream\n${RUPEE_MAP}\nendstream`);
  const rupee = add(`<< /Type /Font /Subtype /Type3 /FontBBox [0 -20 556 740] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs << /rupee ${glyph} 0 R >> /Encoding << /Type /Encoding /Differences [82 /rupee] >> /FirstChar 82 /LastChar 82 /Widths [556] /ToUnicode ${unicode} 0 R >>`);
  const pagesId = objects.length + 1;
  add('');
  const kids: number[] = [];
  for (const lines of pages) {
    let y = 800;
    const stream = lines.map((line) => {
      const head = line.startsWith('# ');
      const face = head ? 'F2' : 'F1';
      const size = head ? 15 : 10.5;
      const out = `BT /${face} ${size} Tf 48 ${y} Td ${pdfShow(head ? line.slice(2) : line, face, size)} ET`;
      y -= head ? 24 : 16;
      return out;
    }).join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R /F3 ${rupee} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objects[pagesId - 1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] >>`;
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

export function download(name: string, data: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const canShareFiles = (): boolean => {
  try {
    return !!navigator.share && !!navigator.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
};

/** The phone's share menu, or a download where sharing files is not possible. A cancel is not an error. */
export async function shareOrDownload(name: string, data: BlobPart, type: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([data], name, { type });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
  download(name, data, type);
  return 'downloaded';
}
