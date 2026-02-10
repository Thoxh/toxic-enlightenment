import { Prisma } from "@prisma/client"
import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { generateTicketCode } from "@/lib/tickets"
import { sendTicketEmail } from "@/lib/send-ticket-email"

export const runtime = "nodejs"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

async function createTicketWithUniqueCode(
  tx: Prisma.TransactionClient,
  purchaseId: string,
  quantity: number,
) {
  // Generate sequential three-digit ticket code
  const code = await generateTicketCode(tx)

  try {
    return await tx.ticket.create({
      data: {
        code,
        quantity,
        purchaseId,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      // If code already exists (shouldn't happen with sequential codes, but handle it)
      throw new Error("Unable to generate a unique ticket code")
    }

    throw error
  }
}

function getSessionString(value: string | Stripe.StripeObject | null | undefined) {
  if (!value) return null
  if (typeof value === "string") return value
  return value.id
}

function getCustomerEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? null
}

function getCustomerName(session: Stripe.Checkout.Session) {
  return session.customer_details?.name ?? null
}

async function recordStripeEvent(event: Stripe.Event) {
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error
    }
  }
}

async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  })

  const normalizedLineItems = lineItems.data.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    amountSubtotal: item.amount_subtotal,
    amountTotal: item.amount_total,
    currency: item.currency,
    priceId: item.price?.id ?? null,
  }))

  const totalQuantity = Math.max(
    1,
    lineItems.data.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  )

  const rawSession = JSON.parse(JSON.stringify(session))
  const customerEmail = getCustomerEmail(session)
  const customerName = getCustomerName(session)

  // Create purchase and ticket in transaction
  // Increased timeout to handle potential database locks
  const result = await prisma.$transaction(async (tx) => {
    const existingPurchase = await tx.purchase.findUnique({
      where: { stripeSessionId: session.id },
      select: { id: true },
    })

    if (existingPurchase) {
      // Already processed - return null to skip email
      return null
    }

    const purchase = await tx.purchase.create({
      data: {
        stripeSessionId: session.id,
        stripePaymentIntentId: getSessionString(session.payment_intent),
        stripeCustomerId: getSessionString(session.customer),
        customerEmail,
        customerName,
        currency: session.currency ?? null,
        amountTotal: session.amount_total ?? null,
        status: "PAID",
        lineItems: normalizedLineItems,
        rawSession,
      },
    })

    const ticket = await createTicketWithUniqueCode(tx, purchase.id, totalQuantity)

    return { purchase, ticket }
  })

  // If purchase was already processed, skip email
  if (!result) {
    console.log(`[Webhook] Purchase already exists for session ${session.id}`)
    return
  }

  const { ticket } = result

  // Send ticket email (outside transaction to not block on email delivery)
  if (customerEmail) {
    console.log(`[Webhook] Sending ticket ${ticket.code} to ${customerEmail}`)
    
    try {
      const emailResult = await sendTicketEmail({
        to: customerEmail,
        customerName,
        ticketCode: ticket.code,
        quantity: ticket.quantity,
      })

      if (emailResult.success) {
        // Update ticket with sentAt timestamp
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { sentAt: new Date() },
        })
        console.log(`[Webhook] Ticket ${ticket.code} sent successfully`)
      } else {
        console.error(`[Webhook] Failed to send ticket ${ticket.code}:`, emailResult.error)
        // Don't throw - the purchase is still valid, just email failed
      }
    } catch (emailError) {
      console.error(`[Webhook] Email error for ticket ${ticket.code}:`, emailError)
      // Don't throw - the purchase is still valid, just email failed
    }
  } else {
    console.warn(`[Webhook] No email for ticket ${ticket.code} - customer has no email`)
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 })
  }

  let event: Stripe.Event

  try {
    const payload = await request.text()
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status === "paid") {
          await handleSuccessfulCheckout(session)
        }

        break
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulCheckout(session)
        break
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
      default:
        break
    }

    await recordStripeEvent(event)
  } catch (error) {
    console.error("Stripe webhook handler failed", error)
    return new Response("Webhook handler failed", { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
