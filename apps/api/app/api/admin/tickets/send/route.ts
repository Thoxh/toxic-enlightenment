import { prisma } from "@/lib/prisma"
import { sendTicketEmail } from "@/lib/send-ticket-email"
import { validateAdminRequest, unauthorizedResponse, handleCorsPreflightResponse } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request)
}

export async function POST(request: Request) {
  const auth = validateAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error!, auth.corsHeaders)
  }

  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Missing ticket code" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
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
      return new Response(JSON.stringify({
        success: false,
        error: "Ticket nicht gefunden",
        code: normalizedCode,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    if (!ticket.purchase.customerEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: "Keine E-Mail-Adresse vorhanden",
        code: normalizedCode,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
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
      return new Response(JSON.stringify({
        success: false,
        error: result.error || "E-Mail konnte nicht gesendet werden",
        code: normalizedCode,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    // Update sentAt timestamp
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        sentAt: new Date(),
      },
    })

    return new Response(JSON.stringify({
      success: true,
      code: normalizedCode,
      email: ticket.purchase.customerEmail,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    console.error("Failed to send ticket email", error)
    return new Response(JSON.stringify({ success: false, error: "E-Mail-Versand fehlgeschlagen" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }
}
