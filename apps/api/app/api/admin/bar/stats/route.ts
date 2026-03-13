import { prisma } from "@/lib/prisma"
import {
  validateAdminRequest,
  unauthorizedResponse,
  handleCorsPreflightResponse,
} from "@/lib/auth"

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
    const result = await prisma.barOrder.aggregate({
      _sum: { total: true },
      _count: true,
    })

    return new Response(
      JSON.stringify({
        totalRevenue: result._sum.total ?? 0,
        totalOrders: result._count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      }
    )
  } catch (error) {
    console.error("Failed to load bar stats", error)
    return new Response(
      JSON.stringify({ error: "Failed to load bar stats" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      }
    )
  }
}
