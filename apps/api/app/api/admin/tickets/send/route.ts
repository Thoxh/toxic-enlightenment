import { prisma } from "@/lib/prisma"
import { sendTicketEmail } from "@/lib/send-ticket-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return true
  const provided = request.headers.get("x-admin-key")
  return provided === adminKey
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code) {
      return Response.json(
        { success: false, error: "Missing ticket code" },
        { status: 400 }
      )
    }

    const normalizedCode = code.toUpperCase().trim()

    // Fetch ticket with purchase details
    const ticket = await prisma.ticket.findUnique({
      where: { code: normalizedCode },
      include: {
        purchase: {
          select: {
            status: true,
            customerEmail: true,
            customerName: true,
          },
        },
      },
    })

    if (!ticket) {
      return Response.json({
        success: false,
        error: "Ticket nicht gefunden",
        code: normalizedCode,
      })
    }

    if (!ticket.purchase.customerEmail) {
      return Response.json({
        success: false,
        error: "Keine E-Mail-Adresse vorhanden",
        code: normalizedCode,
      })
    }

    // Send the email
    const result = await sendTicketEmail({
      to: ticket.purchase.customerEmail,
      customerName: ticket.purchase.customerName,
      ticketCode: ticket.code,
      quantity: ticket.quantity,
    })

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error || "E-Mail konnte nicht gesendet werden",
        code: normalizedCode,
      })
    }

    // Update sentAt timestamp
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        sentAt: new Date(),
      },
    })

    return Response.json({
      success: true,
      code: normalizedCode,
      email: ticket.purchase.customerEmail,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to send ticket email", error)
    return Response.json(
      { success: false, error: "E-Mail-Versand fehlgeschlagen" },
      { status: 500 }
    )
  }
}
