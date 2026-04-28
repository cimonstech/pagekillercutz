import { createHash } from "crypto";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";

export type ContractSettings = {
  version: number;
  deposit_percentage: number;
  payment_deadline_days: number;
  cancellation_tiers: Array<{ label: string; percentage_retained: number }>;
  dj_cancellation_notice_days: number;
  dj_cancellation_compensation_pct: number;
  overtime_rate_ghs: number;
  free_postponements_allowed: number;
  postponement_min_notice_days: number;
  force_majeure_text: string;
  governing_law: string;
  custom_clauses: string[];
};

export async function generateContract(
  booking: Record<string, unknown>,
  settings: ContractSettings,
): Promise<{ contractText: string; contractHash: string; contractHtml: string; pdfBytes: Uint8Array }> {
  const contractText = buildContractText(booking, settings);
  const contractHtml = textToHtml(contractText);
  const contractHash = createHash("sha256").update(contractText).digest("hex");
  const pdfBytes = await generateContractPDF(booking, settings, { contract_hash: contractHash });
  return { contractText, contractHash, contractHtml, pdfBytes };
}

export function buildContractText(booking: Record<string, unknown>, settings: ContractSettings): string {
  const isCompany = Boolean(booking.is_company);
  const clientName = String(booking.client_name ?? "Client");
  const companyName = String(booking.company_name ?? "");
  const repTitle = String(booking.rep_title ?? "");
  const clientBlock = isCompany
    ? `${companyName || "Company"}, represented by ${clientName}${repTitle ? ` (${repTitle})` : ""}`
    : clientName;
  const tiers = (settings.cancellation_tiers ?? [])
    .map((t) => `  • ${t.label}: ${t.percentage_retained}% retained`)
    .join("\n");

  return `
PAGE KILLERCUTZ - DJ SERVICES AGREEMENT
Event ID: ${String(booking.event_id ?? "")}

PARTIES
Service Provider: Page KillerCutz, Accra, Ghana
Client: ${clientBlock}
Email: ${String(booking.client_email ?? "")}
Phone: ${String(booking.client_phone ?? "")}

EVENT DETAILS
Type: ${String(booking.event_type ?? "")}
Date: ${String(booking.event_date ?? "")}
Start Time: ${String(booking.event_start_time_input ?? "TBD")}
Duration: ${String(booking.event_duration_hours ?? 3)} hours
Venue: ${String(booking.venue ?? "")}
Package: ${String(booking.package_name ?? "")}

PAYMENT
Total Fee: GHS ${String(booking.package_price ?? "TBD")}
Deposit (${settings.deposit_percentage}%): GHS ${String(booking.deposit_amount ?? "TBD")}
Balance: Due ${settings.payment_deadline_days} days before event

CANCELLATION BY CLIENT
${tiers}

CANCELLATION BY SERVICE PROVIDER
Minimum ${settings.dj_cancellation_notice_days} days notice.
Full refund + ${settings.dj_cancellation_compensation_pct}% compensation.

POSTPONEMENT
${settings.free_postponements_allowed} free postponement(s) with ${settings.postponement_min_notice_days}+ days notice.

OVERTIME
GHS ${settings.overtime_rate_ghs} per additional hour.

FORCE MAJEURE
${settings.force_majeure_text}

${(settings.custom_clauses ?? []).map((c, i) => `CLAUSE ${i + 1}\n${c}`).join("\n\n")}

GOVERNING LAW
This agreement is governed by the laws of the ${settings.governing_law}.

Signed electronically under Ghana's Electronic Transactions Act 2008 (Act 772).
  `.trim();
}

function textToHtml(text: string): string {
  return `<pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;line-height:1.6;">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;
}

function safeStr(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function money(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bookingDateLong(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildContractHtml(text: string): string {
  return `<pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;line-height:1.6;">${escapeHtml(text)}</pre>`;
}

export async function generateContractPDF(
  booking: any,
  settings: any,
  contract?: any,
  paymentSettings?: any,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 36;
  const colGap = 16;
  const colWidth = (width - margin * 2 - colGap) / 2;
  const leftCol = margin;
  const rightCol = margin + colWidth + colGap;

  // Colours
  const cyan = rgb(0, 0.75, 1);
  const dark = rgb(0.08, 0.08, 0.12);
  const muted = rgb(0.45, 0.48, 0.58);
  const gold = rgb(0.96, 0.65, 0.14);
  const lightRule = rgb(0.88, 0.88, 0.9);
  const sectionBg = rgb(0.95, 0.95, 0.97);
  const white = rgb(1, 1, 1);

  const fmtDate = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const fmtDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  let logoImage: PDFImage | null = null;
  try {
    const logoRes = await fetch("https://assets.pagekillercutz.com/killercutz-logo.png");
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch {
    // continue without logo
  }

  let y = height - margin;

  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: rgb(0.05, 0.05, 0.1),
  });
  page.drawRectangle({
    x: 0,
    y: height - 82,
    width,
    height: 2,
    color: cyan,
  });

  if (logoImage) {
    const logoDims = logoImage.scale(0.06);
    page.drawImage(logoImage, {
      x: margin,
      y: height - margin - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });

    const logoRight = margin + logoDims.width + 8;
    page.drawText("PAGE KILLERCUTZ", {
      x: logoRight,
      y: height - margin - 10,
      size: 11,
      font: bold,
      color: white,
    });
    page.drawText("DJ Services Agreement", {
      x: logoRight,
      y: height - margin - 22,
      size: 8,
      font,
      color: rgb(0.6, 0.65, 0.75),
    });
  } else {
    page.drawText("PAGE KILLERCUTZ", {
      x: margin,
      y: height - margin - 10,
      size: 13,
      font: bold,
      color: white,
    });
    page.drawText("DJ Services Agreement", {
      x: margin,
      y: height - margin - 22,
      size: 8,
      font,
      color: rgb(0.6, 0.65, 0.75),
    });
  }

  const eventIdText = `Event ID: ${safeStr(booking.event_id)}`;
  const eventIdWidth = bold.widthOfTextAtSize(eventIdText, 9);
  page.drawText(eventIdText, {
    x: width - margin - eventIdWidth,
    y: height - margin - 10,
    size: 9,
    font: bold,
    color: cyan,
  });

  const genText = `Generated: ${new Date().toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
  const genWidth = font.widthOfTextAtSize(genText, 8);
  page.drawText(genText, {
    x: width - margin - genWidth,
    y: height - margin - 22,
    size: 8,
    font,
    color: rgb(0.6, 0.65, 0.75),
  });

  y = height - 96;

  const drawSectionHeader = (title: string, x: number, currentY: number): number => {
    page.drawRectangle({
      x,
      y: currentY - 14,
      width: colWidth,
      height: 16,
      color: sectionBg,
    });
    page.drawRectangle({
      x,
      y: currentY - 14,
      width: 2,
      height: 16,
      color: cyan,
    });
    page.drawText(title, {
      x: x + 6,
      y: currentY - 10,
      size: 7.5,
      font: bold,
      color: rgb(0.25, 0.25, 0.35),
    });
    return currentY - 22;
  };

  const drawRow = (
    label: string,
    value: string,
    x: number,
    currentY: number,
    valueColor = dark,
    valueBold = false,
  ): number => {
    page.drawText(label, {
      x,
      y: currentY,
      size: 7.5,
      font,
      color: muted,
    });

    const maxWidth = colWidth - 4;
    const vFont = valueBold ? bold : font;
    const words = value.split(" ");
    let line = "";
    let lineY = currentY;

    words.forEach((word) => {
      const test = `${line}${word} `;
      const testWidth = vFont.widthOfTextAtSize(test, 8);

      if (testWidth > maxWidth - 80 && line !== "") {
        page.drawText(line.trim(), {
          x: x + 76,
          y: lineY,
          size: 8,
          font: vFont,
          color: valueColor,
        });
        lineY -= 11;
        line = `${word} `;
      } else {
        line = test;
      }
    });

    if (line.trim()) {
      page.drawText(line.trim(), {
        x: x + 76,
        y: lineY,
        size: 8,
        font: vFont,
        color: valueColor,
      });
      lineY -= 11;
    }

    return lineY - 2;
  };

  const drawRule = (x: number, currentY: number, w = colWidth): number => {
    page.drawLine({
      start: { x, y: currentY },
      end: { x: x + w, y: currentY },
      thickness: 0.4,
      color: lightRule,
    });
    return currentY - 6;
  };

  // Left column
  let leftY = y;

  leftY = drawSectionHeader("PARTIES", leftCol, leftY);
  const isCompany = Boolean(booking.is_company);
  const clientDisplay = isCompany ? safeStr(booking.company_name) : safeStr(booking.client_name);
  const repDisplay = isCompany
    ? `${safeStr(booking.client_name)} (${safeStr(booking.rep_title) || "Authorised Rep"})`
    : null;

  leftY = drawRow("Service Provider", "PAGE KillerCutz, Accra, Ghana", leftCol, leftY);
  leftY = drawRow("Client", clientDisplay, leftCol, leftY, dark, true);
  if (repDisplay) leftY = drawRow("Representative", repDisplay, leftCol, leftY);
  leftY = drawRow("Email", safeStr(booking.client_email), leftCol, leftY);
  leftY = drawRow("Phone", safeStr(booking.client_phone), leftCol, leftY);
  leftY -= 8;

  leftY = drawSectionHeader("EVENT DETAILS", leftCol, leftY);
  leftY = drawRow("Event Type", safeStr(booking.event_type), leftCol, leftY);
  leftY = drawRow("Event Date", booking.event_date ? fmtDate(safeStr(booking.event_date)) : "—", leftCol, leftY, dark, true);
  leftY = drawRow("Start Time", safeStr(booking.event_start_time_input) || "TBD", leftCol, leftY);
  leftY = drawRow("Duration", `${safeStr(booking.event_duration_hours || 3)} hours`, leftCol, leftY);
  leftY = drawRow("Venue", safeStr(booking.venue), leftCol, leftY);
  leftY = drawRow("Package", safeStr(booking.package_name) || "—", leftCol, leftY, cyan, true);
  if (booking.guest_count) leftY = drawRow("Guests", String(booking.guest_count), leftCol, leftY);
  leftY -= 8;

  leftY = drawSectionHeader("CANCELLATION POLICY", leftCol, leftY);
  const tiers = settings?.cancellation_tiers || [];
  tiers.forEach((tier: any) => {
    page.drawText(`• ${tier.label}:`, {
      x: leftCol + 4,
      y: leftY,
      size: 7.5,
      font,
      color: muted,
    });
    page.drawText(`${tier.percentage_retained}% retained`, {
      x: leftCol + 100,
      y: leftY,
      size: 7.5,
      font: bold,
      color: dark,
    });
    leftY -= 12;
  });
  leftY -= 8;

  leftY = drawSectionHeader("OTHER TERMS", leftCol, leftY);
  leftY = drawRow("Overtime", `GHS ${safeStr(settings?.overtime_rate_ghs || 500)} per additional hour`, leftCol, leftY);
  leftY = drawRow(
    "DJ Cancels",
    `Full refund + ${safeStr(settings?.dj_cancellation_compensation_pct || 20)}% compensation`,
    leftCol,
    leftY,
  );
  leftY = drawRow(
    "Postponement",
    `${safeStr(settings?.free_postponements_allowed || 1)} free with ${safeStr(settings?.postponement_min_notice_days || 14)}+ days notice`,
    leftCol,
    leftY,
  );
  leftY = drawRow("Governing Law", safeStr(settings?.governing_law || "Republic of Ghana"), leftCol, leftY);

  if (settings?.force_majeure_text) {
    leftY -= 6;
    page.drawText("Force Majeure:", {
      x: leftCol,
      y: leftY,
      size: 7,
      font: bold,
      color: muted,
    });
    leftY -= 10;

    const fmWords = safeStr(settings.force_majeure_text).split(" ");
    let fmLine = "";
    fmWords.forEach((w: string) => {
      const test = `${fmLine}${w} `;
      if (font.widthOfTextAtSize(test, 6.5) > colWidth - 4) {
        page.drawText(fmLine.trim(), {
          x: leftCol + 4,
          y: leftY,
          size: 6.5,
          font,
          color: muted,
        });
        leftY -= 9;
        fmLine = `${w} `;
      } else {
        fmLine = test;
      }
    });
    if (fmLine.trim()) {
      page.drawText(fmLine.trim(), {
        x: leftCol + 4,
        y: leftY,
        size: 6.5,
        font,
        color: muted,
      });
      leftY -= 9;
    }
  }

  // Right column
  let rightY = y;
  rightY = drawSectionHeader("PAYMENT SUMMARY", rightCol, rightY);

  const total = money(booking.package_price || 0);
  const depositPct = money(settings?.deposit_percentage || 30);
  const depositAmt = Math.round((total * depositPct) / 100);
  const balanceAmt = total - depositAmt;

  page.drawRectangle({
    x: rightCol,
    y: rightY - 20,
    width: colWidth,
    height: 22,
    color: rgb(0.05, 0.05, 0.1),
  });
  page.drawText("TOTAL FEE", {
    x: rightCol + 6,
    y: rightY - 14,
    size: 7,
    font: bold,
    color: rgb(0.6, 0.65, 0.75),
  });
  const totalText = total > 0 ? `GHS ${total.toLocaleString()}` : "TBD";
  const totalTextWidth = bold.widthOfTextAtSize(totalText, 11);
  page.drawText(totalText, {
    x: rightCol + colWidth - totalTextWidth - 6,
    y: rightY - 15,
    size: 11,
    font: bold,
    color: gold,
  });
  rightY -= 28;

  rightY = drawRow(
    `Deposit (${depositPct}%)`,
    total > 0 ? `GHS ${depositAmt.toLocaleString()}` : "TBD",
    rightCol,
    rightY,
    dark,
    true,
  );
  const depositDueDisplay = booking.deposit_due_date
    ? `${fmtDate(safeStr(booking.deposit_due_date))} (within 3 days of booking)`
    : "Within 3 days of confirmation";
  rightY = drawRow("Deposit Due", depositDueDisplay, rightCol, rightY, gold);
  rightY -= 4;
  drawRule(rightCol, rightY);

  rightY = drawRow(
    "Balance (70%)",
    total > 0 ? `GHS ${balanceAmt.toLocaleString()}` : "TBD",
    rightCol,
    rightY,
    dark,
    true,
  );
  const balanceDueDisplay = booking.balance_due_date
    ? `${fmtDate(safeStr(booking.balance_due_date))} (2 days before event)`
    : "2 days before event";
  rightY = drawRow("Balance Due", balanceDueDisplay, rightCol, rightY, muted);
  rightY -= 8;

  rightY = drawSectionHeader("PAYMENT DETAILS", rightCol, rightY);
  rightY = drawRow("Method", "Mobile Money / Bank Transfer", rightCol, rightY);
  rightY = drawRow("Reference", safeStr(booking.event_id), rightCol, rightY, cyan, true);
  if (paymentSettings?.momo_enabled) {
    rightY = drawRow(
      `${safeStr(paymentSettings.momo_network)} MoMo`,
      safeStr(paymentSettings.momo_number),
      rightCol,
      rightY,
      dark,
      true,
    );
    rightY = drawRow("Account Name", safeStr(paymentSettings.momo_account_name || "PAGE KillerCutz"), rightCol, rightY);
  }
  if (paymentSettings?.bank_enabled && paymentSettings?.bank_name) {
    rightY = drawRow("Bank", safeStr(paymentSettings.bank_name), rightCol, rightY);
    rightY = drawRow("Account No.", safeStr(paymentSettings.bank_account_number), rightCol, rightY, dark, true);
  }
  rightY -= 8;

  rightY = drawSectionHeader("SIGNATURES", rightCol, rightY);
  page.drawRectangle({
    x: rightCol,
    y: rightY - 44,
    width: colWidth,
    height: 46,
    color: rgb(0.97, 0.97, 0.99),
    borderColor: lightRule,
    borderWidth: 0.5,
  });
  page.drawText("Service Provider", {
    x: rightCol + 6,
    y: rightY - 10,
    size: 7,
    font: bold,
    color: muted,
  });
  page.drawText("PAGE KillerCutz", {
    x: rightCol + 6,
    y: rightY - 22,
    size: 9,
    font: bold,
    color: dark,
  });
  page.drawText(`Date: ${new Date().toLocaleDateString("en-GH")}`, {
    x: rightCol + 6,
    y: rightY - 36,
    size: 7,
    font,
    color: muted,
  });

  if (contract?.dj_signature_data) {
    try {
      const djSigBytes = Buffer.from(safeStr(contract.dj_signature_data).replace(/^data:image\/png;base64,/, ""), "base64");
      const djSigImg = await pdfDoc.embedPng(djSigBytes);
      page.drawImage(djSigImg, {
        x: rightCol + colWidth - 80,
        y: rightY - 40,
        width: 72,
        height: 32,
      });
    } catch {
      // no DJ signature image
    }
  }
  rightY -= 52;

  const isSigned = contract?.status === "signed";
  const hasDrawnClientSig =
    isSigned &&
    Boolean(contract?.client_signature_data) &&
    (contract?.client_signature_type === "drawn" || contract?.client_signature_type === "draw");
  page.drawRectangle({
    x: rightCol,
    y: rightY - 70,
    width: colWidth,
    height: 72,
    color: isSigned ? rgb(0.95, 0.99, 0.96) : rgb(0.97, 0.97, 0.99),
    borderColor: isSigned ? rgb(0.55, 0.85, 0.6) : rgb(0.85, 0.85, 0.88),
    borderWidth: 0.5,
  });

  const clientSigLabel = isCompany
    ? `${safeStr(booking.client_name)} · ${safeStr(booking.rep_title) || "Authorised Rep"} · ${safeStr(booking.company_name)}`
    : safeStr(booking.client_name);
  page.drawText("Client", {
    x: rightCol + 6,
    y: rightY - 10,
    size: 7,
    font: bold,
    color: muted,
  });
  page.drawText(clientSigLabel, {
    x: rightCol + 6,
    y: rightY - 22,
    size: 8.5,
    font: bold,
    color: dark,
  });

  if (isSigned && contract?.client_signature_data) {
    const sigType = contract.client_signature_type;
    if (sigType === "drawn" || sigType === "draw") {
      try {
        const rawSig = safeStr(contract.client_signature_data);
        const b64 = rawSig.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        const cSigBytes = Buffer.from(b64, "base64");
        const cSigImg =
          rawSig.includes("data:image/jpeg") || rawSig.includes("data:image/jpg")
            ? await pdfDoc.embedJpg(cSigBytes)
            : await pdfDoc.embedPng(cSigBytes);
        const maxW = colWidth - 12;
        const maxH = 36;
        const sigDims = cSigImg.scaleToFit(maxW, maxH);
        page.drawImage(cSigImg, {
          x: rightCol + 6,
          y: rightY - 34 - sigDims.height,
          width: sigDims.width,
          height: sigDims.height,
          opacity: 1,
        });
      } catch {
        page.drawText(safeStr(booking.client_name), {
          x: rightCol + 6,
          y: rightY - 46,
          size: 14,
          font: bold,
          color: dark,
        });
      }
    } else if (sigType === "typed" || sigType === "type") {
      page.drawText(safeStr(contract.client_signature_data), {
        x: rightCol + 6,
        y: rightY - 46,
        size: 15,
        font: bold,
        color: dark,
      });
      const nameWidth = bold.widthOfTextAtSize(safeStr(contract.client_signature_data), 15);
      page.drawLine({
        start: { x: rightCol + 6, y: rightY - 50 },
        end: { x: rightCol + 6 + Math.min(nameWidth, colWidth - 12), y: rightY - 50 },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.5),
      });
    }

    if (contract.client_signed_at) {
      page.drawText(`Signed: ${fmtDateTime(contract.client_signed_at)} GMT`, {
        x: rightCol + 6,
        y: rightY - 60,
        size: 6.5,
        font,
        color: muted,
      });
    }
    if (contract.client_ip) {
      page.drawText(`IP: ${safeStr(contract.client_ip)}`, {
        x: rightCol + 6,
        y: rightY - 68,
        size: 6,
        font,
        color: rgb(0.6, 0.6, 0.65),
      });
    }
    const stampText = "SIGNED";
    const stampWidth = bold.widthOfTextAtSize(stampText, 8);
    page.drawText(stampText, {
      x: rightCol + colWidth - stampWidth - 6,
      y: rightY - 12,
      size: 8,
      font: bold,
      color: rgb(0.2, 0.72, 0.32),
    });
  } else {
    page.drawLine({
      start: { x: rightCol + 6, y: rightY - 44 },
      end: { x: rightCol + colWidth - 10, y: rightY - 44 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.8),
    });
    page.drawText("Signature:", {
      x: rightCol + 6,
      y: rightY - 38,
      size: 7,
      font,
      color: muted,
    });
    page.drawText("Date: _______________", {
      x: rightCol + 6,
      y: rightY - 60,
      size: 7,
      font,
      color: muted,
    });
  }
  rightY -= 80;

  if (contract?.status === "signed" && contract.client_ip) {
    page.drawText(`IP: ${safeStr(contract.client_ip)}  Method: ${safeStr(contract.client_signature_type)}`, {
      x: rightCol,
      y: rightY,
      size: 6.5,
      font,
      color: muted,
    });
  }

  // Footer
  const footerY = 28;
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: footerY + 8,
    color: rgb(0.05, 0.05, 0.1),
  });
  page.drawText(
    "Signed electronically under Ghana's Electronic Transactions Act 2008 (Act 772)  ·  pagekillercutz.com",
    {
      x: margin,
      y: footerY - 2,
      size: 6.5,
      font,
      color: rgb(0.5, 0.52, 0.6),
    },
  );

  if (contract?.contract_hash) {
    page.drawText(`SHA256: ${safeStr(contract.contract_hash)}`, {
      x: margin,
      y: 12,
      size: 5.5,
      font,
      color: rgb(0.35, 0.37, 0.45),
    });
  }

  return pdfDoc.save();
}
