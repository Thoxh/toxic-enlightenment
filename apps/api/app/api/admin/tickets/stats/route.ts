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

    return Response.json({
      totalTickets,
      totalQuantity,
      totalRedeemed,
      totalRemaining,
      percentageRedeemed:
        totalQuantity > 0
          ? Math.round((totalRedeemed / totalQuantity) * 100)
          : 0,
    })
  } catch (error) {
    console.error("Failed to load stats", error)
    return Response.json(
      { error: "Failed to load stats" },
      { status: 500 }
    )
  }
}
