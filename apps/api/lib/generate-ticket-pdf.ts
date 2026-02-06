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

// ============================================
// IMAGE CACHE - Load once, reuse for all PDFs
// ============================================
interface ImageCache {
  background: { data: string; format: "JPEG" | "PNG" } | null
  logo: { data: string; format: "JPEG" | "PNG" } | null
  loaded: boolean
}

const imageCache: ImageCache = {
  background: null,
  logo: null,
  loaded: false,
}

function getPublicPath(): string {
  // For Vercel: process.cwd() points to the app directory
  // Try multiple paths to handle both local dev and Vercel deployment
  const possibleRoots = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "apps/api/public"),
    path.join(__dirname, "../public"),
    path.join(__dirname, "../../public"),
  ]

  for (const root of possibleRoots) {
    if (fs.existsSync(root)) {
      return root
    }
  }

  // Fallback
  return path.join(process.cwd(), "public")
}

function loadImageAsBase64(filename: string): { data: string; format: "JPEG" | "PNG" } | null {
  const publicPath = getPublicPath()
  const fullPath = path.join(publicPath, filename)

  try {
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath)
      const isJpeg = filename.endsWith(".jpg") || filename.endsWith(".jpeg")
      const format: "JPEG" | "PNG" = isJpeg ? "JPEG" : "PNG"
      const mimeType = isJpeg ? "image/jpeg" : "image/png"
      const data = `data:${mimeType};base64,${buffer.toString("base64")}`
      console.log(`[PDF] Loaded ${filename} (${Math.round(buffer.length / 1024)}KB)`)
      return { data, format }
    }
  } catch (e) {
    console.error(`[PDF] Failed to load ${filename}:`, e)
  }

  return null
}

function loadImagesIntoCache(): void {
  if (imageCache.loaded) return

  const publicPath = getPublicPath()
  console.log(`[PDF] Loading images from: ${publicPath}`)

  // Load background (prefer JPEG for smaller size)
  imageCache.background = loadImageAsBase64("ticket_background.jpg") 
    || loadImageAsBase64("ticket_background.png")

  // Load logo
  imageCache.logo = loadImageAsBase64("sk-events.png")
    || loadImageAsBase64("sk-events.jpg")

  imageCache.loaded = true

  if (!imageCache.background) {
    console.warn("[PDF] No background image found - using fallback color")
  }
  if (!imageCache.logo) {
    console.warn("[PDF] No logo image found")
  }
}

// Pre-load images on module init
loadImagesIntoCache()

// ============================================
// PDF GENERATION - Optimized for small file size
// ============================================
export async function generateTicketPdf(ticket: TicketPdfData): Promise<Blob> {
  // Ensure images are cached
  if (!imageCache.loaded) {
    loadImagesIntoCache()
  }

  // Create PDF in A4 format with compression
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true, // Enable compression
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add background image or fallback
  // Using JPEG format tells jsPDF to keep JPEG compression
  if (imageCache.background) {
    doc.addImage(
      imageCache.background.data,
      imageCache.background.format,
      0,
      0,
      pageWidth,
      pageHeight,
      undefined, // alias
      "FAST" // compression: FAST, MEDIUM, SLOW (FAST = less processing, still compressed)
    )
  } else {
    // Fallback to dark background
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, pageWidth, pageHeight, "F")
  }

  // Generate QR Code - smaller size for faster generation
  const qrDataUrl = await QRCode.toDataURL(ticket.code, {
    width: 200, // Reduced - still plenty for scanning
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  // Header - Event Title
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

  // QR Code - centered
  const qrSize = 70
  const qrX = (pageWidth - qrSize) / 2
  const qrY = 88
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize, undefined, "FAST")

  // Ticket Code below QR
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(ticket.code, pageWidth / 2, qrY + qrSize + 12, { align: "center" })

  // Ticket Info Box
  const boxY = qrY + qrSize + 30
  const boxPadding = 12
  doc.setFillColor(18, 18, 18)
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

  // Info Section
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

  // Logo bottom left
  if (imageCache.logo) {
    const logoWidth = 32
    const logoHeight = 8
    doc.addImage(imageCache.logo.data, imageCache.logo.format, 8, pageHeight - 14, logoWidth, logoHeight, undefined, "FAST")
  }

  // Footer
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Veranstalter: Emanuel Vierow · soundkioskevents.de", pageWidth / 2, pageHeight - 8, { align: "center" })
  doc.text("Alle Infos zur Veranstaltung, dem Veranstalter und den AGB unter soundkioskevents.de", pageWidth / 2, pageHeight - 12, { align: "center" })

  // Return as Blob
  return doc.output("blob")
}
