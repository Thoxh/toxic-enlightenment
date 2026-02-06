import { Resend } from "resend"
import { render } from "@react-email/components"
import * as React from "react"
import { TicketEmail } from "../emails/ticket-email"
import { generateTicketPdf } from "./generate-ticket-pdf"
import fs from "fs"
import path from "path"

const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================
// POSTER CACHE - Load once, reuse for all emails
// ============================================
interface PosterCache {
  buffer: Buffer | null
  contentType: string
  loaded: boolean
}

const posterCache: PosterCache = {
  buffer: null,
  contentType: "image/jpeg",
  loaded: false,
}

function getPublicPath(): string {
  // For Vercel: process.cwd() points to the app directory
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

  return path.join(process.cwd(), "public")
}

function loadPosterIntoCache(): void {
  if (posterCache.loaded) return

  const publicPath = getPublicPath()
  
  // Try JPEG first (smaller), then PNG
  const candidates = ["poster.jpg", "poster.jpeg", "poster.png"]
  
  for (const filename of candidates) {
    const fullPath = path.join(publicPath, filename)
    try {
      if (fs.existsSync(fullPath)) {
        posterCache.buffer = fs.readFileSync(fullPath)
        posterCache.contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg"
        posterCache.loaded = true
        console.log(`[Email] Poster cached: ${filename} (${Math.round(posterCache.buffer.length / 1024)}KB)`)
        return
      }
    } catch (e) {
      console.error(`[Email] Failed to load ${filename}:`, e)
    }
  }

  console.error("[Email] No poster found!")
  posterCache.loaded = true // Prevent retry
}

// Pre-load poster on module init
loadPosterIntoCache()

// ============================================
// EMAIL SENDING
// ============================================
interface SendTicketEmailParams {
  to: string
  customerName?: string | null
  ticketCode: string
  quantity: number
}

export async function sendTicketEmail({
  to,
  customerName,
  ticketCode,
  quantity,
}: SendTicketEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Ensure poster is cached
    if (!posterCache.loaded) {
      loadPosterIntoCache()
    }

    // Generate ticket PDF (uses cached images internally)
    const pdfBlob = await generateTicketPdf({
      code: ticketCode,
      quantity,
      customerName: customerName || null,
      customerEmail: to,
    })
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

    console.log(`[Email] PDF generated: ${Math.round(pdfBuffer.length / 1024)}KB`)

    // Poster CID for inline embedding
    const posterCid = "poster@toxic-enlightenment"
    const posterUrl = `cid:${posterCid}`

    // Render email HTML
    const html = await render(
      React.createElement(TicketEmail, {
        customerName,
        ticketCode,
        quantity,
        posterUrl,
      }),
      { pretty: true }
    )

    // Create plain text version
    const ticketText = quantity === 1 ? "Ticket" : "Tickets"
    const plainText = `
Hey ${customerName?.trim() || "there"}!

Dein ${ticketText} für TOXIC ENLIGHTENMENT ist bereit!

TICKET CODE: ${ticketCode}
Anzahl Gäste: ${quantity}

PUMPENHAUS KIRCHMÖSER
Bahntechnikerring 13
14774 Brandenburg an der Havel

14. März 2026 • 21:00 Uhr

Dein Ticket findest du als PDF im Anhang.
Zeige den QR-Code am Einlass vor.

Wichtige Hinweise:
• Einlass ab 18 Jahren – Ausweis nicht vergessen!
• Ticket gilt für einmaligen Eintritt
• Kein Wiedereinlass

Wir freuen uns auf dich!

---

Wenn du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.

Sound Kiosk Events
Emanuel Vierow
Reiherweg 1
99089 Erfurt

Website: https://soundkioskevents.de
Kontakt: https://soundkioskevents.de/kontakt
Datenschutz: https://soundkioskevents.de/datenschutz
AGBs: https://soundkioskevents.de/agb

E-Mail: info@soundkiosk.one
USt-IdNr.: DE364566218

© ${new Date().getFullYear()} Sound Kiosk Events. Alle Rechte vorbehalten.
    `.trim()

    // Build attachments
    const attachments: Array<{
      filename: string
      content: Buffer
      contentType: string
      contentId?: string
    }> = [
      {
        filename: `ticket-${ticketCode}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ]

    // Add poster as inline attachment if available
    if (posterCache.buffer) {
      const posterFilename = posterCache.contentType === "image/png" ? "poster.png" : "poster.jpg"
      attachments.push({
        filename: posterFilename,
        content: posterCache.buffer,
        contentType: posterCache.contentType,
        contentId: posterCid,
      })
    }

    const totalSize = attachments.reduce((sum, a) => sum + a.content.length, 0)
    console.log(`[Email] Sending to ${to} with ${attachments.length} attachments (${Math.round(totalSize / 1024)}KB total)`)

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Toxic Enlightenment <no-reply@tickets.soundkioskevents.de>",
      to: [to],
      subject: `Dein Ticket für TOXIC ENLIGHTENMENT`,
      html,
      text: plainText,
      attachments,
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Sent successfully: ${data?.id}`)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error("Failed to send ticket email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
