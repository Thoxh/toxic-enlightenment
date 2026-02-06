import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/admin/tickets/stats`,
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
      { error: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    )
  }
}
