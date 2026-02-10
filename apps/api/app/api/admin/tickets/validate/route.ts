import { prisma } from "@/lib/prisma"
import { validateAdminRequest, unauthorizedResponse, handleCorsPreflightResponse } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request)
}

export async function GET(request: Request) {
  const auth = validateAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error!, auth.corsHeaders)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return new Response(JSON.stringify({ valid: false, error: "Missing ticket code" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { code: code.toUpperCase().trim() },
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
        valid: false,
        error: "Ticket nicht gefunden",
        code,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    if (ticket.purchase.status !== "PAID") {
      return new Response(JSON.stringify({
        valid: false,
        error: "Ticket nicht bezahlt",
        code,
        status: ticket.purchase.status,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    const remainingQuantity = ticket.quantity - ticket.redeemedCount

    return new Response(JSON.stringify({
      valid: true,
      code: ticket.code,
      ticketId: ticket.id,
      quantity: ticket.quantity,
      redeemedCount: ticket.redeemedCount,
      remainingQuantity,
      fullyRedeemed: remainingQuantity <= 0,
      customerEmail: ticket.purchase.customerEmail,
      customerName: ticket.purchase.customerName,
      firstRedeemedAt: ticket.firstRedeemedAt,
      lastRedeemedAt: ticket.lastRedeemedAt,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    logger.error("Failed to validate ticket", { error: String(error) })
    await logger.flush()
    return new Response(JSON.stringify({ valid: false, error: "Validierung fehlgeschlagen" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }
}

export async function POST(request: Request) {
  const auth = validateAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error!, auth.corsHeaders)
  }

  try {
    const body = await request.json()
    const { code, redeemCount = 1 } = body as {
      code?: string
      redeemCount?: number
    }

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Missing ticket code" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    const normalizedCode = code.toUpperCase().trim()

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

    if (ticket.purchase.status !== "PAID") {
      return new Response(JSON.stringify({
        success: false,
        error: "Ticket nicht bezahlt",
        code: normalizedCode,
        status: ticket.purchase.status,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    const remainingQuantity = ticket.quantity - ticket.redeemedCount

    if (remainingQuantity <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Ticket bereits vollständig eingelöst",
        code: normalizedCode,
        quantity: ticket.quantity,
        redeemedCount: ticket.redeemedCount,
        remainingQuantity: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      })
    }

    const actualRedeemCount = Math.min(redeemCount, remainingQuantity)
    const now = new Date()

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        redeemedCount: ticket.redeemedCount + actualRedeemCount,
        firstRedeemedAt: ticket.firstRedeemedAt ?? now,
        lastRedeemedAt: now,
      },
    })

    const newRemainingQuantity =
      updatedTicket.quantity - updatedTicket.redeemedCount

    return new Response(JSON.stringify({
      success: true,
      code: updatedTicket.code,
      ticketId: updatedTicket.id,
      redeemedNow: actualRedeemCount,
      quantity: updatedTicket.quantity,
      redeemedCount: updatedTicket.redeemedCount,
      remainingQuantity: newRemainingQuantity,
      fullyRedeemed: newRemainingQuantity <= 0,
      customerEmail: ticket.purchase.customerEmail,
      customerName: ticket.purchase.customerName,
      timestamp: now.toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    logger.error("Failed to redeem ticket", { error: String(error) })
    await logger.flush()
    return new Response(JSON.stringify({ success: false, error: "Einlösung fehlgeschlagen" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }
}
