import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

async function getAdminKeyHeader() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return null
  }
  return ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}
}

export async function POST(request: Request) {
  const adminKeyHeader = await getAdminKeyHeader()
  if (!adminKeyHeader) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code) {
      return Response.json(
        { success: false, error: "Missing ticket code" },
        { status: 400 }
      )
    }

    // Forward request to API
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/admin/tickets/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminKeyHeader,
        },
        body: JSON.stringify({ code }),
      }
    )

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error("Failed to send ticket email:", error)
    return Response.json(
      { success: false, error: "Failed to send ticket email" },
      { status: 500 }
    )
  }
}
