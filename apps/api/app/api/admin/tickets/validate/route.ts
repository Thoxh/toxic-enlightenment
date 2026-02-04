import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return true
  const provided = request.headers.get("x-admin-key")
  return provided === adminKey
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return Response.json(
      { valid: false, error: "Missing ticket code" },
      { status: 400 }
    )
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
      return Response.json({
        valid: false,
        error: "Ticket nicht gefunden",
        code,
      })
    }

    if (ticket.purchase.status !== "PAID") {
      return Response.json({
        valid: false,
        error: "Ticket nicht bezahlt",
        code,
        status: ticket.purchase.status,
      })
    }

    const remainingQuantity = ticket.quantity - ticket.redeemedCount

    return Response.json({
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
    })
  } catch (error) {
    console.error("Failed to validate ticket", error)
    return Response.json(
      { valid: false, error: "Validierung fehlgeschlagen" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, redeemCount = 1 } = body as {
      code?: string
      redeemCount?: number
    }

    if (!code) {
      return Response.json(
        { success: false, error: "Missing ticket code" },
        { status: 400 }
      )
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
      return Response.json({
        success: false,
        error: "Ticket nicht gefunden",
        code: normalizedCode,
      })
    }

    if (ticket.purchase.status !== "PAID") {
      return Response.json({
        success: false,
        error: "Ticket nicht bezahlt",
        code: normalizedCode,
        status: ticket.purchase.status,
      })
    }

    const remainingQuantity = ticket.quantity - ticket.redeemedCount

    if (remainingQuantity <= 0) {
      return Response.json({
        success: false,
        error: "Ticket bereits vollständig eingelöst",
        code: normalizedCode,
        quantity: ticket.quantity,
        redeemedCount: ticket.redeemedCount,
        remainingQuantity: 0,
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

    return Response.json({
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
    })
  } catch (error) {
    console.error("Failed to redeem ticket", error)
    return Response.json(
      { success: false, error: "Einlösung fehlgeschlagen" },
      { status: 500 }
    )
  }
}
