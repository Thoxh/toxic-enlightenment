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
    const [aggregation, productStats] = await Promise.all([
      prisma.barOrder.aggregate({
        _sum: { total: true },
        _count: true,
      }),
      prisma.barOrderItem.groupBy({
        by: ["name", "category"],
        _count: { id: true },
        _sum: { price: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ])

    return new Response(
      JSON.stringify({
        totalRevenue: aggregation._sum.total ?? 0,
        totalOrders: aggregation._count,
        products: productStats.map((p) => ({
          name: p.name,
          category: p.category,
          count: p._count.id,
          revenue: p._sum.price ?? 0,
        })),
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
