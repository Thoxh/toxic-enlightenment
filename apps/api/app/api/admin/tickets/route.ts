import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LIMIT = 500

function parseLimit(value: string | null) {
  if (!value) return 100
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return 100
  return Math.min(parsed, MAX_LIMIT)
}

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
  const limit = parseLimit(searchParams.get("limit"))
  const cursor = searchParams.get("cursor")

  try {
    const tickets = await prisma.ticket.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        purchase: {
          select: {
            stripeSessionId: true,
            customerEmail: true,
            customerName: true,
            amountTotal: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    const nextCursor = tickets.length === limit ? tickets.at(-1)?.id ?? null : null

    return new Response(JSON.stringify({ data: tickets, nextCursor }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Failed to load tickets", error)
    return new Response("Failed to load tickets", { status: 500 })
  }
}
