import { prisma } from "@/lib/prisma"
import { validateAdminRequest, unauthorizedResponse, handleCorsPreflightResponse } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LIMIT = 500

function parseLimit(value: string | null) {
  if (!value) return 100
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return 100
  return Math.min(parsed, MAX_LIMIT)
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request)
}

export async function GET(request: Request) {
  const auth = validateAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error!, auth.corsHeaders)
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
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    console.error("Failed to load tickets", error)
    return new Response(JSON.stringify({ error: "Failed to load tickets" }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  }
}
