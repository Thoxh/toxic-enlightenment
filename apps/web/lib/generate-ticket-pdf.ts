import { jsPDF } from "jspdf"
import QRCode from "qrcode"

interface TicketPdfData {
  code: string
  quantity: number
  customerName: string | null
  customerEmail: string | null
}

export async function generateTicketPdf(ticket: TicketPdfData): Promise<Blob> {
  // Create PDF in A4 format
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Background - dark theme
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // Generate QR Code as data URL
  const qrDataUrl = await QRCode.toDataURL(ticket.code, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  // Header - Event Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.text("TOXIC ENLIGHTENMENT", pageWidth / 2, 35, { align: "center" })

  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(150, 150, 150)
  doc.text("@ Pumpenhaus by SOUNDKIOSK EVENTS", pageWidth / 2, 45, { align: "center" })

  // Divider line
  doc.setDrawColor(50, 50, 50)
  doc.setLineWidth(0.5)
  doc.line(margin, 55, pageWidth - margin, 55)

  // Event Details Section
  doc.setTextColor(34, 197, 94) // Green accent
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("14. MÄRZ 2026 • 21 UHR", pageWidth / 2, 70, { align: "center" })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Altes Pumpenhaus Kirchmöser", pageWidth / 2, 80, { align: "center" })

  // QR Code - centered and larger
  const qrSize = 80
  const qrX = (pageWidth - qrSize) / 2
  const qrY = 95
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

  // Ticket Code below QR
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(ticket.code, pageWidth / 2, qrY + qrSize + 12, { align: "center" })

  // Ticket Info Box
  const boxY = qrY + qrSize + 25
  doc.setFillColor(25, 25, 25)
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 35, 3, 3, "F")

  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text("TICKET FÜR", margin + 10, boxY + 12)
  doc.text("ANZAHL GÄSTE", pageWidth - margin - 10, boxY + 12, { align: "right" })

  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  const displayName = ticket.customerName || ticket.customerEmail || "Gast"
  doc.text(displayName, margin + 10, boxY + 25)
  doc.text(ticket.quantity.toString(), pageWidth - margin - 10, boxY + 25, { align: "right" })

  // Event Description
  const descY = boxY + 45
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)

  const description = [
    "Die Erleuchtung lädt nicht bei schlechtem WLAN.",
    "Sie kommt um 21 Uhr, riecht nach Nebel und kickt bei 140 BPM.",
    "Hip Hop trifft Techno. Beton trifft Bass.",
    "Du triffst Leute, die du ab morgen auf Instagram suchst.",
    "Pommes gegen den Hunger. Drinks gegen den Rest.",
    "Einlass ab 21 Uhr. Ende wenn's hell wird.",
    "Ein Ticket. Ein Weg rein. Der Rest ist dein Problem.",
  ]

  let currentY = descY
  for (const line of description) {
    doc.text(line, pageWidth / 2, currentY, { align: "center" })
    currentY += 5
  }

  // Footer - fixe Position am unteren Rand
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Dieses Ticket ist einmalig einlösbar. Bei Verlust kann kein Ersatz ausgestellt werden.", pageWidth / 2, pageHeight - 12, { align: "center" })

  // Return as Blob
  return doc.output("blob")
}
