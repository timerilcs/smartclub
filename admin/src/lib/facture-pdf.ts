import jsPDF from "jspdf";
import { formatXPF } from "@/lib/currency";

// jsPDF's built-in Helvetica doesn't include U+202F (narrow no-break space)
// used by fr-FR locale as thousands separator — it renders as "/".
function safe(s: string): string {
  return s.replace(/ | /g, " ");
}

const MONTH_NAMES = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

interface EcoleInfo {
  sarl?: string | null;
  rue?: string | null;
  cp?: string | null;
  ville?: string | null;
  tahiti?: string | null;
  tel?: string | null;
  mobile?: string | null;
  email?: string | null;
  nom_directeur?: string | null;
  prenom_directeur?: string | null;
  banque?: string | null;
  domiciliation?: string | null;
  iban?: string | null;
  bic?: string | null;
  compte?: string | null;
}

interface FactureData {
  id_facturation: number;
  date_facturation?: string | null;
  objet?: string | null;
  montant?: number | null;
  id_mois?: number | null;
}

interface InscriptionData {
  prenom?: string | null;
  nom?: string | null;
  legal_prenom?: string | null;
  legal_nom?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
}

interface AgendaInfo {
  debut?: string | null;
  fin?: string | null;
  lieu?: string | null;
  heure_debut?: string | null;
  heure_fin?: string | null;
}

interface PaiementData {
  montant?: number | null;
  type?: string | null;
  date_paiement?: string | null;
}

function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00");
  return `Le ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00");
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const MAX = 700;
      const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Sépare le libellé "Nom de la formule : N x Xh Heures" en nom + heures */
function splitHeuresLabel(heuresLabel: string): { nom: string | null; heures: string } {
  const sep = " : ";
  const idx = heuresLabel.indexOf(sep);
  if (idx === -1) return { nom: null, heures: heuresLabel };
  return { nom: heuresLabel.slice(0, idx), heures: heuresLabel.slice(idx + sep.length) };
}

async function buildFactureDoc(
  facture: FactureData,
  inscription: InscriptionData | null,
  ecole: EcoleInfo | null,
  paiements: PaiementData[] = [],
  agenda: AgendaInfo | null = null,
  heuresLabel: string | null = null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // === LOGO IMAGE ===
  try {
    const { default: logoUrl } = await import("@/assets/logo-smartclub.png");
    const logoBase64 = await loadImageAsBase64(logoUrl);
    const logoW = 64;
    const logoH = logoW * 131 / 700;
    doc.addImage(logoBase64, "PNG", (pw - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(51, 51, 51);
    doc.text("SMARTCLUB", pw / 2, y + 10, { align: "center" });
    y += 16;
  }

  // === COMPANY INFO ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  const companyLines = [
    ecole?.sarl || "SMARTCLUB",
    ecole?.rue || "",
    `${ecole?.cp || ""} ${ecole?.ville || ""}`.trim(),
    ecole?.tahiti ? `N° TAHITI : ${ecole.tahiti}` : "",
    ecole?.mobile || ecole?.tel || "",
    ecole?.email || "",
  ].filter(Boolean);

  companyLines.forEach(line => {
    if (line.startsWith("N°")) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 51, 51);
    }
    doc.text(line, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    y += 4.5;
  });

  // === DESTINATAIRE (right side) ===
  const destX = pw - margin;
  let destY = 50;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Destinataire", destX, destY, { align: "right" });
  destY += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  const clientName = inscription
    ? `${inscription.legal_prenom || inscription.prenom || ""} ${inscription.legal_nom || inscription.nom || ""}`.trim()
    : "—";
  doc.text(clientName, destX, destY, { align: "right" });
  destY += 5;

  if (inscription?.ville) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(inscription.ville, destX, destY, { align: "right" });
  }

  // === FACTURE HEADER ===
  y = Math.max(y, destY) + 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text(`Facture n° ${facture.id_facturation}`, margin, y);
  y += 6;

  // Mois facturé (champ id_mois de la facture) — distinct de la date d'émission ci-dessous :
  // un abonnement mensuel (10 mois, sept. à juin) peut être généré et réglé par avance,
  // donc la date de facturation ne correspond pas forcément au mois d'atelier facturé.
  if (facture.id_mois && facture.id_mois >= 1 && facture.id_mois <= 12) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 120, 180);
    doc.text(`Facture de ${MONTH_NAMES[facture.id_mois - 1]}`, margin, y);
    y += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(formatDateLong(facture.date_facturation || null), margin, y);
  y += 12;

  // === TABLE HEADER ===
  const tableLeft = margin;
  const tableRight = pw - margin;
  const tableWidth = tableRight - tableLeft;

  // Header background
  doc.setFillColor(240, 240, 240);
  doc.rect(tableLeft, y - 4, tableWidth, 8, "F");
  doc.setDrawColor(200, 200, 200);
  doc.line(tableLeft, y - 4, tableRight, y - 4);
  doc.line(tableLeft, y + 4, tableRight, y + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text("Formation", tableLeft + 4, y + 1);
  doc.text("Montant", tableRight - 4, y + 1, { align: "right" });
  y += 10;

  // === TABLE BODY ===
  const descColWidth = tableWidth - 60; // leave more room for amounts
  const amountY = y; // save for amount alignment

  // Nom de la formule (gras) — le nombre d'heures ("Pack N Heures") n'est plus indiqué sur la facture.
  if (heuresLabel) {
    const { nom, heures } = splitHeuresLabel(heuresLabel);
    const label = nom && !nom.startsWith("Forfait") ? nom : (!heures.startsWith("Pack ") ? heures : null);
    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 51, 51);
      doc.splitTextToSize(label, descColWidth - 8).forEach((l: string) => {
        doc.text(l, tableLeft + 4, y);
        y += 4;
      });
    }
  }

  // Amount on right, aligned with first line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.text(safe(formatXPF(facture.montant)), tableRight - 4, amountY, { align: "right" });

  y += 4;

  // === TVA NOTE ===
  doc.setDrawColor(200, 200, 200);
  doc.line(tableLeft, y, tableRight, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(0, 120, 180);
  doc.text("« TVA non applicable - article 293 B du CGI »", tableLeft + 4, y);
  y += 10;

  // === TOTAL BAR ===
  doc.setFillColor(240, 240, 240);
  doc.rect(tableLeft, y - 4, tableWidth, 10, "F");
  doc.setDrawColor(200, 200, 200);
  doc.line(tableLeft, y - 4, tableRight, y - 4);
  doc.line(tableLeft, y + 6, tableRight, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 120, 180);
  doc.text("Coût total", tableLeft + 4, y + 2);

  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.text(safe(formatXPF(facture.montant)), tableRight - 4, y + 1, { align: "right" });

  y += 16;

  // === PAYMENT INFO ===
  const totalPaid = paiements.reduce((s, p) => s + (p.montant || 0), 0);
  const isFullyPaid = totalPaid >= (facture.montant || 0) && totalPaid > 0;

  if (totalPaid > 0) {
    paiements.filter(p => (p.montant || 0) > 0).forEach(p => {
      const pDate = p.date_paiement ? new Date(p.date_paiement + "T12:00:00").toLocaleDateString("fr-FR") : "";

      const fullLine = `Acquittée en ${p.type || "paiement"} de ${safe(formatXPF(p.montant))} le ${pDate}`;
      const flw = doc.getTextWidth(fullLine);
      const startX = (pw - flw) / 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text("Acquittée en ", startX, y);
      let cx = startX + doc.getTextWidth("Acquittée en ");

      doc.setFont("helvetica", "bold");
      doc.text(`${p.type || "paiement"}`, cx, y);
      cx += doc.getTextWidth(`${p.type || "paiement"}`);

      doc.setFont("helvetica", "normal");
      doc.text(` de `, cx, y);
      cx += doc.getTextWidth(` de `);

      doc.setFont("helvetica", "bold");
      doc.text(`${safe(formatXPF(p.montant))}`, cx, y);
      cx += doc.getTextWidth(`${safe(formatXPF(p.montant))}`);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text(` le ${pDate}`, cx, y);

      y += 6;
    });

    // === ACQUITTÉE STAMP ===
    if (isFullyPaid) {
      y += 6;
      const stampText = "FACTURE ACQUITTÉE";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 80);
      const stampW = doc.getTextWidth(stampText) + 12;
      const stampX = (pw - stampW) / 2;
      doc.setDrawColor(0, 150, 80);
      doc.setLineWidth(0.8);
      doc.roundedRect(stampX, y - 5, stampW, 10, 2, 2, "S");
      doc.text(stampText, pw / 2, y + 1.5, { align: "center" });
    }
  }

  // === MODES DE RÈGLEMENT & COORDONNÉES BANCAIRES ===
  y += 14;

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  const colLeftX = margin;
  const colWidth = (tableRight - tableLeft) / 2;
  const colRightX = tableLeft + colWidth + 8;
  const blockTop = y;

  // --- Bloc gauche : Modes de règlement acceptés ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text("Modes de règlement acceptés", colLeftX, y);
  let yLeft = y + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Espèces", colLeftX, yLeft);
  yLeft += 4.5;
  doc.text("Virement bancaire", colLeftX, yLeft);
  yLeft += 4.5;

  // --- Bloc droit : Coordonnées bancaires ---
  let yRight = y;
  if (ecole?.banque || ecole?.iban || ecole?.bic) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text("Coordonnées bancaires", colRightX, yRight);
    yRight += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    const bankLines: string[] = [];
    if (ecole.banque) bankLines.push(`Banque : ${ecole.banque}`);
    if (ecole.agence) bankLines.push(`Agence : ${ecole.agence}`);
    if (ecole.compte) bankLines.push(`Compte : ${ecole.compte}`);
    if (ecole.cle) bankLines.push(`Clé : ${ecole.cle}`);
    if (ecole.iban) bankLines.push(`IBAN : ${ecole.iban}`);
    if (ecole.bic) bankLines.push(`BIC : ${ecole.bic}`);

    bankLines.forEach(line => {
      doc.text(line, colRightX, yRight);
      yRight += 4.5;
    });
  }

  // Séparateur vertical entre les deux blocs
  const blockBottom = Math.max(yLeft, yRight);
  doc.setDrawColor(200, 200, 200);
  doc.line(tableLeft + colWidth, blockTop - 4, tableLeft + colWidth, blockBottom);

  y = blockBottom;

  return doc;
}

export async function generateFacturePdf(
  facture: FactureData,
  inscription: InscriptionData | null,
  ecole: EcoleInfo | null,
  paiements: PaiementData[] = [],
  agenda: AgendaInfo | null = null,
  heuresLabel: string | null = null
): Promise<void> {
  const doc = await buildFactureDoc(facture, inscription, ecole, paiements, agenda, heuresLabel);
  doc.save(`facture-${facture.id_facturation}.pdf`);
}

export async function getFacturePdfBase64(
  facture: FactureData,
  inscription: InscriptionData | null,
  ecole: EcoleInfo | null,
  paiements: PaiementData[] = [],
  agenda: AgendaInfo | null = null,
  heuresLabel: string | null = null
): Promise<string> {
  const doc = await buildFactureDoc(facture, inscription, ecole, paiements, agenda, heuresLabel);
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}
