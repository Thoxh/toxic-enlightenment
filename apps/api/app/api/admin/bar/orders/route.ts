import { prisma } from "@/lib/prisma"
import {
  validateAdminRequest,
  unauthorizedResponse,
  handleCorsPreflightResponse,
} from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface OrderItem {
  name: string
  price: number
  category: string
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request)
}

export async function POST(request: Request) {
  const auth = validateAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error!, auth.corsHeaders)
  }

  try {
    const body = (await request.json()) as { items: OrderItem[] }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "items are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...auth.corsHeaders },
        }
      )
    }

    const total = body.items.reduce((sum, item) => sum + item.price, 0)

    const order = await prisma.barOrder.create({
      data: {
        total,
        items: {
          create: body.items.map((item) => ({
            name: item.name,
            price: item.price,
            category: item.category,
          })),
        },
      },
      include: { items: true },
    })

    return new Response(JSON.stringify({ success: true, order }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...auth.corsHeaders },
    })
  } catch (error) {
    console.error("Failed to create bar order", error)
    return new Response(
      JSON.stringify({ error: "Failed to create bar order" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...auth.corsHeaders },
      }
    )
  }
}
