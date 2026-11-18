import jsPDF from "jspdf";

interface ParticipantLabel {
  prenom: string | null;
  nom: string | null;
  kids_email: string | null;
  kids_password_temp: string | null;
}

interface AgendaLabelInfo {
  nom_camp: string;
  debut: string | null;
  fin: string | null;
  lieu: string | null;
}

const LABELS_PER_PAGE = 12;
const COLS = 2;
const ROWS = 6;

// Marges et dimensions (en mm, page A4 210x297)
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 8;
const MARGIN_Y = 10;
const GAP_X = 4;
const GAP_Y = 4;

const LABEL_W = (PAGE_W - MARGIN_X * 2 - GAP_X * (COLS - 1)) / COLS; // ~95mm
const LABEL_H = (PAGE_H - MARGIN_Y * 2 - GAP_Y * (ROWS - 1)) / ROWS; // ~44.5mm

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function generateIdentifiantsPdf(
  participants: ParticipantLabel[],
  agenda: AgendaLabelInfo
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const validParticipants = participants.filter(p => p.kids_email);

  if (validParticipants.length === 0) {
    // Page vide avec message
    doc.setFontSize(12);
    doc.setTextColor(150);
    doc.text("Aucun participant avec des identifiants Espace Kids.", PAGE_W / 2, PAGE_H / 2, { align: "center" });
    doc.save("identifiants.pdf");
    return;
  }

  let pageIndex = 0;

  for (let i = 0; i < validParticipants.length; i++) {
    const posOnPage = i % LABELS_PER_PAGE;

    if (posOnPage === 0 && i > 0) {
      doc.addPage();
      pageIndex++;
    }

    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const x = MARGIN_X + col * (LABEL_W + GAP_X);
    const y = MARGIN_Y + row * (LABEL_H + GAP_Y);

    drawLabel(doc, validParticipants[i], agenda, x, y);
  }

  const campSlug = agenda.nom_camp.replace(/\s+/g, "_").toLowerCase();
  doc.save(`identifiants_${campSlug}.pdf`);
}

function drawLabel(
  doc: jsPDF,
  participant: ParticipantLabel,
  agenda: AgendaLabelInfo,
  x: number,
  y: number
): void {
  const PAD = 3;

  // Fond de l'étiquette
  doc.setFillColor(248, 249, 252);
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, LABEL_W, LABEL_H, 2, 2, "FD");

  // Bandeau en-tête coloré
  doc.setFillColor(59, 130, 246); // bleu Polykids
  doc.roundedRect(x, y, LABEL_W, 8, 2, 2, "F");
  // Masquer les coins ronds en bas du bandeau
  doc.setFillColor(59, 130, 246);
  doc.rect(x, y + 4, LABEL_W, 4, "F");

  // Texte du bandeau : nom du camp + dates
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  const campText = agenda.nom_camp;
  doc.text(campText, x + PAD, y + 3.8);

  // Dates à droite dans le bandeau
  if (agenda.debut || agenda.fin) {
    const dateText = `${formatDateShort(agenda.debut)}${agenda.fin ? ` → ${formatDateShort(agenda.fin)}` : ""}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(dateText, x + LABEL_W - PAD, y + 3.8, { align: "right" });
  }

  // Nom de l'enfant
  const fullName = `${participant.prenom || ""} ${participant.nom || ""}`.trim();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(fullName, x + PAD, y + 14.5);

  // Séparateur
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(x + PAD, y + 17, x + LABEL_W - PAD, y + 17);

  // Icône + Login
  const loginLabelY = y + 23;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 120, 160);
  doc.text("IDENTIFIANT", x + PAD, loginLabelY - 3.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(20, 30, 60);

  // Fond de la valeur login
  doc.setFillColor(235, 242, 255);
  doc.setDrawColor(180, 200, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + PAD, loginLabelY - 2.8, LABEL_W - PAD * 2, 5.5, 1, 1, "FD");
  doc.text(participant.kids_email || "—", x + PAD + 1.5, loginLabelY + 1.2);

  // Mot de passe
  const mdpLabelY = y + 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 120, 160);
  doc.text("MOT DE PASSE", x + PAD, mdpLabelY - 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 100, 30);

  // Fond de la valeur mot de passe
  doc.setFillColor(230, 250, 235);
  doc.setDrawColor(160, 220, 170);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + PAD, mdpLabelY - 2.8, LABEL_W - PAD * 2, 5.5, 1, 1, "FD");
  doc.text(participant.kids_password_temp || "—", x + PAD + 1.5, mdpLabelY + 1.2);

  // Lieu (petite info en bas)
  if (agenda.lieu) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(150, 160, 180);
    doc.text(agenda.lieu, x + LABEL_W - PAD, y + LABEL_H - 1.5, { align: "right" });
  }
}
