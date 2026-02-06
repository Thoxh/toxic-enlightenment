import { prisma } from "@/lib/prisma"
import { generateTicketCode } from "@/lib/tickets"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return true
  const provided = request.headers.get("x-admin-key")
  return provided === adminKey
}

interface CreateTicketBody {
  customerEmail: string
  customerName?: string
  quantity: number
  amountTotal?: number
  currency?: string
  notes?: string
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = (await request.json()) as CreateTicketBody

    // Validate required fields
    if (!body.customerEmail || !body.quantity) {
      return new Response(
        JSON.stringify({ error: "customerEmail and quantity are required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      )
    }

    if (body.quantity < 1 || body.quantity > 10) {
      return new Response(
        JSON.stringify({ error: "quantity must be between 1 and 10" }),
        { status: 400, headers: { "content-type": "application/json" } }
      )
    }

    // Generate sequential three-digit ticket code
    const ticketCode = await generateTicketCode()

    // Create a manual purchase record
    const manualSessionId = `manual_${crypto.randomUUID()}`

    const purchase = await prisma.purchase.create({
      data: {
        stripeSessionId: manualSessionId,
        customerEmail: body.customerEmail,
        customerName: body.customerName || null,
        amountTotal: body.amountTotal || 0,
        currency: body.currency || "EUR",
        status: "PAID",
        lineItems: body.notes ? { notes: body.notes } : null,
        tickets: {
          create: {
            code: ticketCode,
            quantity: body.quantity,
          },
        },
      },
      include: {
        tickets: true,
      },
    })

    const ticket = purchase.tickets[0]

    return new Response(
      JSON.stringify({
        success: true,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          quantity: ticket.quantity,
          customerEmail: purchase.customerEmail,
          customerName: purchase.customerName,
        },
        purchase: {
          id: purchase.id,
          stripeSessionId: purchase.stripeSessionId,
        },
      }),
      { status: 201, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Failed to create ticket", error)
    return new Response(
      JSON.stringify({ error: "Failed to create ticket" }),
      { status: 500, headers: { "content-type": "application/json" } }
    )
  }
}
