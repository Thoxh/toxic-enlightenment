export type TicketRow = {
  id: string
  code: string
  quantity: number
  redeemedCount: number
  firstRedeemedAt: string | null
  lastRedeemedAt: string | null
  sentAt: string | null
  createdAt: string
  purchase: {
    stripeSessionId: string
    customerEmail: string | null
    customerName: string | null
    amountTotal: number | null
    currency: string | null
    status: string
    createdAt: string
  }
}

export type TicketValidationResult = {
  valid: boolean
  error?: string
  code?: string
  ticketId?: string
  quantity?: number
  redeemedCount?: number
  remainingQuantity?: number
  fullyRedeemed?: boolean
  customerEmail?: string | null
  customerName?: string | null
  firstRedeemedAt?: string | null
  lastRedeemedAt?: string | null
  status?: string
}

export type TicketRedeemResult = {
  success: boolean
  error?: string
  code?: string
  ticketId?: string
  redeemedNow?: number
  quantity?: number
  redeemedCount?: number
  remainingQuantity?: number
  fullyRedeemed?: boolean
  customerEmail?: string | null
  customerName?: string | null
  timestamp?: string
}

function getApiConfig() {
  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"
  const adminKey = process.env.API_ADMIN_KEY ?? process.env.NEXT_PUBLIC_API_ADMIN_KEY
  return { baseUrl: baseUrl.replace(/\/$/, ""), adminKey }
}

export async function getTickets() {
  const { baseUrl, adminKey } = getApiConfig()

  const response = await fetch(
    `${baseUrl}/api/admin/tickets?limit=200`,
    {
      method: "GET",
      headers: {
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch tickets (${response.status})`)
  }

  const payload = (await response.json()) as {
    data: TicketRow[]
    nextCursor: string | null
  }

  return payload
}

export async function validateTicket(code: string): Promise<TicketValidationResult> {
  // Use local API proxy for client-side requests
  const isClient = typeof window !== "undefined"
  
  if (isClient) {
    const response = await fetch(
      `/api/tickets/validate?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    )
    return response.json()
  }

  const { baseUrl, adminKey } = getApiConfig()

  const response = await fetch(
    `${baseUrl}/api/admin/tickets/validate?code=${encodeURIComponent(code)}`,
    {
      method: "GET",
      headers: {
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      cache: "no-store",
    },
  )

  return response.json()
}

export async function redeemTicket(code: string, redeemCount = 1): Promise<TicketRedeemResult> {
  // Use local API proxy for client-side requests
  const isClient = typeof window !== "undefined"
  
  if (isClient) {
    const response = await fetch(
      `/api/tickets/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, redeemCount }),
      },
    )
    return response.json()
  }

  const { baseUrl, adminKey } = getApiConfig()

  const response = await fetch(
    `${baseUrl}/api/admin/tickets/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      body: JSON.stringify({ code, redeemCount }),
    },
  )

  return response.json()
}
