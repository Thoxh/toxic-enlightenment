import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000"
const API_ADMIN_KEY = process.env.API_ADMIN_KEY

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return Response.json(
      { valid: false, error: "Missing ticket code" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/admin/tickets/validate?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: {
          ...(API_ADMIN_KEY ? { "x-admin-key": API_ADMIN_KEY } : {}),
        },
      }
    )

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return Response.json(
      { valid: false, error: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()

    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/admin/tickets/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_ADMIN_KEY ? { "x-admin-key": API_ADMIN_KEY } : {}),
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return Response.json(
      { success: false, error: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    )
  }
}
