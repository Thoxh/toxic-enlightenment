import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

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
          ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
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
          ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
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
