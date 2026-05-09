import jsPDF from "jspdf";

export interface ScriptPDFData {
  topik: string;
  judul: string;
  platform: string;
  jenisKonten: string;
  tone: string;
  tanggal?: string;
  statusRevisi?: string;
  script: string;
  skorViralitas?: number | null;
  analisisAI?: string;
  rekomendasi?: string;
}

/** Strip emoji and non-latin characters that jsPDF/helvetica can't render */
function sanitize(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")  // emoji block
    .replace(/[\u{2600}-\u{27BF}]/gu, "")      // misc symbols
    .replace(/[^\x00-\x7F\u00C0-\u024F]/g, "") // keep latin + extended latin only
    .replace(/\*\*/g, "")                       // strip markdown bold **
    .replace(/\*/g, "")                         // strip markdown italic *
    .replace(/#+\s/g, "")                       // strip markdown headings
    .trim();
}

/** Sanitize but keep basic punctuation and newlines */
function sanitizeBlock(text: string): string {
  return text
    .split("\n")
    .map((line) => sanitize(line))
    .join("\n");
}

const BRAND_GREEN: [number, number, number] = [100, 140, 110];
const DARK: [number, number, number] = [30, 30, 30];
const MID: [number, number, number] = [90, 90, 90];
const LIGHT: [number, number, number] = [150, 150, 150];
const RULE: [number, number, number] = [210, 220, 215];
const INFO_BG: [number, number, number] = [245, 248, 246];

export function downloadScriptPDF(data: ScriptPDFData) {
  const {
    topik, judul, platform, jenisKonten, tone,
    tanggal, statusRevisi, script, skorViralitas,
    analisisAI, rekomendasi,
  } = data;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const mX = 18;          // horizontal margin
  const contentW = pageW - mX * 2;
  let y = 0;

  /* ── helpers ──────────────────────────────────────── */

  function checkPageBreak(needed = 10) {
    if (y + needed > pageH - 16) {
      addFooter();
      doc.addPage();
      y = 20;
    }
  }

  function addFooter() {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT);
    doc.text(
      `Sambelfarm Content Lab  •  ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      pageW / 2, pageH - 8, { align: "center" },
    );
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(mX, pageH - 12, pageW - mX, pageH - 12);
  }

  function sectionLabel(label: string) {
    checkPageBreak(10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_GREEN);
    doc.text(label.toUpperCase(), mX, y);
    y += 5;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(mX, y, pageW - mX, y);
    y += 5;
  }

  function metaRow(label: string, value: string, xLeft: number, yRow: number, colW: number) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MID);
    doc.text(label, xLeft, yRow);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(sanitize(value) || "—", colW - 22) as string[];
    lines.forEach((ln, i) => doc.text(ln, xLeft + 22, yRow + i * 4.5));
    return lines.length * 4.5;
  }

  /* ── HEADER BANNER ───────────────────────────────── */
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageW, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("SAMBELFARM CONTENT LAB", pageW / 2, 10, { align: "center" });

  y = 26;

  /* ── TITLE ───────────────────────────────────────── */
  const titleText = sanitize(judul || topik || "Script");
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(titleText, contentW) as string[];
  titleLines.forEach((line) => { doc.text(line, mX, y); y += 9; });

  if (topik && judul) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(`Topik: ${sanitize(topik)}`, mX, y);
    y += 6;
  }

  y += 3;

  /* ── META INFO BOX (2-column grid) ───────────────── */
  const metaItems: [string, string][] = [
    ["Platform", platform],
    ["Jenis", jenisKonten],
    ["Tone", tone],
    ["Status", statusRevisi || ""],
    ["Tanggal", tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""],
    ["Skor", skorViralitas != null ? `${Math.round(skorViralitas)} / 100` : ""],
  ].filter(([, v]) => v) as [string, string][];

  const colW = contentW / 2;
  const boxH = Math.ceil(metaItems.length / 2) * 10 + 8;
  doc.setFillColor(...INFO_BG);
  doc.roundedRect(mX, y, contentW, boxH, 3, 3, "F");
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.roundedRect(mX, y, contentW, boxH, 3, 3, "S");

  const boxStartY = y + 6;
  metaItems.forEach(([label, value], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = mX + 5 + col * (colW);
    const yPos = boxStartY + row * 10;
    metaRow(label, value, xPos, yPos, colW);
  });

  y += boxH + 8;

  /* ── SCRIPT ──────────────────────────────────────── */
  sectionLabel("Naskah Script");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  const rawScript = sanitizeBlock(script || "(kosong)");
  const paragraphs = rawScript.split(/\n{2,}/);       // split on blank lines

  paragraphs.forEach((para) => {
    checkPageBreak(8);
    const trimmed = para.trim();
    if (!trimmed) return;

    // Detect section-like headers (e.g. lines ending with ":" or all-caps short lines)
    const subLines = trimmed.split("\n");
    subLines.forEach((subLine) => {
      const clean = subLine.trim();
      if (!clean) { y += 3; return; }

      // Styled heading if short line ending with ":"
      if (clean.endsWith(":") && clean.length < 40) {
        checkPageBreak(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND_GREEN);
        doc.setFontSize(9.5);
        doc.text(clean, mX, y);
        y += 5.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.setFontSize(10);
        return;
      }

      // Normal body text — wrap to content width
      const wrapped = doc.splitTextToSize(clean, contentW) as string[];
      wrapped.forEach((ln) => {
        checkPageBreak(6);
        doc.text(ln, mX, y);
        y += 5.5;
      });
    });

    y += 3; // paragraph gap
  });

  /* ── ANALISIS AI (if present) ────────────────────── */
  if (analisisAI) {
    y += 4;
    checkPageBreak(14);
    sectionLabel("Analisis AI");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const aiLines = doc.splitTextToSize(sanitize(analisisAI), contentW) as string[];
    aiLines.forEach((ln) => {
      checkPageBreak(6);
      doc.text(ln, mX, y);
      y += 5.5;
    });
  }

  /* ── REKOMENDASI (if present) ────────────────────── */
  if (rekomendasi) {
    y += 4;
    checkPageBreak(14);
    sectionLabel("Rekomendasi");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const rekLines = doc.splitTextToSize(sanitize(rekomendasi), contentW) as string[];
    rekLines.forEach((ln) => {
      checkPageBreak(6);
      doc.text(ln, mX, y);
      y += 5.5;
    });
  }

  /* ── FOOTER on last page ─────────────────────────── */
  addFooter();

  /* ── SAVE ────────────────────────────────────────── */
  const filename = titleText
    .slice(0, 50)
    .replace(/[^a-z0-9\s]/gi, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase() || "script";

  doc.save(`${filename}.pdf`);
}
