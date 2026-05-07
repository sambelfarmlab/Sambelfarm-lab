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
}

export function downloadScriptPDF(data: ScriptPDFData) {
  const { topik, judul, platform, jenisKonten, tone, tanggal, script, skorViralitas } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const pageW = 210;
  const contentW = pageW - marginX * 2;
  const lh = 6;
  let y = 0;

  doc.setFillColor(125, 157, 133);
  doc.rect(0, 0, pageW, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SAMBELFARM CONTENT LAB", pageW / 2, 9, { align: "center" });

  y = 26;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  const titleText = judul || topik || "Script";
  const titleLines = doc.splitTextToSize(titleText, contentW) as string[];
  titleLines.forEach((line: string) => { doc.text(line, marginX, y); y += 8; });

  y += 1;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  const meta = [
    topik ? `Topik: ${topik}` : null,
    platform ? `Platform: ${platform}` : null,
    jenisKonten ? `Jenis: ${jenisKonten}` : null,
    tone ? `Tone: ${tone}` : null,
    tanggal ? `Tanggal: ${tanggal}` : null,
    skorViralitas != null ? `Skor Viralitas: ${Math.round(skorViralitas)}` : null,
  ].filter(Boolean).join("   |   ");
  if (meta) { doc.text(meta, marginX, y); y += lh * 1.5; }

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += lh * 1.5;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(125, 157, 133);
  doc.text("NASKAH SCRIPT", marginX, y);
  y += lh;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const scriptLines = doc.splitTextToSize(script || "(kosong)", contentW) as string[];
  scriptLines.forEach((line: string) => {
    if (y > 272) { doc.addPage(); y = 20; }
    doc.text(line, marginX, y);
    y += lh;
  });

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Dibuat oleh Sambelfarm Content Lab • ${new Date().toLocaleDateString("id-ID")}`,
    pageW / 2, 291, { align: "center" }
  );

  const filename = titleText.slice(0, 50).replace(/[^a-z0-9\s]/gi, "").trim().replace(/\s+/g, "_").toLowerCase() || "script";
  doc.save(`${filename}.pdf`);
}
