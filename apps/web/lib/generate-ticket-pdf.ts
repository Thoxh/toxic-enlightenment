import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import fs from "fs"
import path from "path"

interface TicketPdfData {
  code: string
  quantity: number
  customerName: string | null
  customerEmail: string | null
}

// Helper to load image as base64 from filesystem (server-side)
function loadImageAsBase64(imagePath: string): string {
  // Try multiple possible paths for the image
  const possiblePaths = [
    // When running from monorepo root
    path.join(process.cwd(), "apps/web/public", imagePath),
    // When running from apps/web directory
    path.join(process.cwd(), "public", imagePath),
    // Relative to this file
    path.join(__dirname, "../public", imagePath),
    path.join(__dirname, "../../public", imagePath),
  ]

  for (const fullPath of possiblePaths) {
    try {
      if (fs.existsSync(fullPath)) {
        console.log(`Loading image from: ${fullPath}`)
        const buffer = fs.readFileSync(fullPath)
        return `data:image/png;base64,${buffer.toString("base64")}`
      }
    } catch {
      // Try next path
    }
  }

  console.error(`Image not found in any of these paths:`, possiblePaths)
  console.error(`Current working directory: ${process.cwd()}`)
  throw new Error(`Image not found: ${imagePath}`)
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

  // Load background and logo images
  let backgroundLoaded = false
  let logoLoaded = false
  let backgroundBase64 = ""
  let logoBase64 = ""

  try {
    backgroundBase64 = loadImageAsBase64("ticket_background.png")
    backgroundLoaded = true
  } catch (e) {
    console.error("Failed to load background:", e)
  }

  try {
    logoBase64 = loadImageAsBase64("sk-events.png")
    logoLoaded = true
  } catch (e) {
    console.error("Failed to load logo:", e)
  }

  // Add background image or fallback
  if (backgroundLoaded) {
    doc.addImage(backgroundBase64, "PNG", 0, 0, pageWidth, pageHeight)
  } else {
    // Fallback to dark background
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, pageWidth, pageHeight, "F")
  }

  // Generate QR Code as data URL
  const qrDataUrl = await QRCode.toDataURL(ticket.code, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  // Header - Event Title (Helvetica Black = boldest available)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(36)
  doc.setFont("helvetica", "bold")
  doc.text("TOXIC ENLIGHTENMENT", pageWidth / 2, 28, { align: "center" })

  // Subtitle
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("@Pumpenhaus", pageWidth / 2, 38, { align: "center" })



  // Event Details Section
  doc.setTextColor(34, 197, 94) // Green accent
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("14. MÄRZ 2026 • 21 UHR", pageWidth / 2, 66, { align: "center" })

  // Address
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Bahntechnikerring 13, 14774 Brandenburg an der Havel", pageWidth / 2, 78, { align: "center" })

  // QR Code - centered and larger
  const qrSize = 70
  const qrX = (pageWidth - qrSize) / 2
  const qrY = 88
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

  // Ticket Code below QR (bolder)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(ticket.code, pageWidth / 2, qrY + qrSize + 12, { align: "center" })

  // Ticket Info Box (more space below ticket code)
  const boxY = qrY + qrSize + 30
  const boxPadding = 12
  doc.setFillColor(18, 18, 18) // Darker gray
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 38, 3, 3, "F")

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(150, 150, 150)
  doc.text("TICKET FÜR", margin + boxPadding, boxY + 14)
  doc.text("ANZAHL GÄSTE", pageWidth - margin - boxPadding, boxY + 14, { align: "right" })

  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  const displayName = ticket.customerName || ticket.customerEmail || "Gast"
  doc.text(displayName, margin + boxPadding, boxY + 26)
  doc.text(ticket.quantity.toString(), pageWidth - margin - boxPadding, boxY + 26, { align: "right" })

  // Info Section (above footer)
  const infoY = boxY + 60
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(250, 250, 250) 

  const infoLines = [
    "Ticket gültig für einmaligen Eintritt · Kein Wiedereinlass",
    "Einlass ab 18 Jahren · Ausweispflicht",
    "Keine Rückerstattung · Ticket ist nicht übertragbar",
    "Bei Fragen: info@soundkiosk.me",
  ]

  let currentY = infoY
  for (const line of infoLines) {
    doc.text(line, pageWidth / 2, currentY, { align: "center" })
    currentY += 5
  }

  // Logo bottom left - further into corner
  if (logoLoaded) {
    const logoWidth = 32
    const logoHeight = 8
    doc.addImage(logoBase64, "PNG", 8, pageHeight - 14, logoWidth, logoHeight)
  }

  // Footer - bottom
  doc.setTextColor(200, 200, 200) // Lighter gray
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Veranstalter: Emanuel Vierow · soundkioskevents.de", pageWidth / 2, pageHeight - 8, { align: "center" })
  doc.text("Alle Infos zur Veranstaltung, dem Veranstalter und den AGB unter soundkioskevents.de", pageWidth / 2, pageHeight - 12, { align: "center" })

  // Return as Blob
  return doc.output("blob")
}
