import { prisma } from "@/lib/prisma"
import { validateAdminRequest, unauthorizedResponse, handleCorsPreflightResponse } from "@/lib/auth"

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

  try {
    // Get all tickets with their quantities
    const tickets = await prisma.ticket.findMany({
      where: {
        purchase: {
          status: "PAID",
        },
      },
      select: {
        quantity: true,
        redeemedCount: true,
      },
    })

    const totalTickets = tickets.length
    const totalQuantity = tickets.reduce((sum, t) => sum + t.quantity, 0)
    const totalRedeemed = tickets.reduce((sum, t) => sum + t.redeemedCount, 0)
    const totalRemaining = totalQuantity - totalRedeemed

    return new Response(JSON.stringify({
      totalTickets,
      totalQuantity,
      totalRedeemed,
      totalRemaining,
      percentageRedeemed:
        totalQuantity > 0
          ? Math.round((totalRedeemed / totalQuantity) * 100)
          : 0,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    console.error("Failed to load stats", error)
    return new Response(JSON.stringify({ error: "Failed to load stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }
}
