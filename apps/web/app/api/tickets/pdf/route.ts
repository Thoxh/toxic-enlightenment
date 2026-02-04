import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateTicketPdf } from "@/lib/generate-ticket-pdf"

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

export async function GET(request: Request) {
  const adminKeyHeader = await getAdminKeyHeader()
  if (!adminKeyHeader) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return new Response("Missing ticket code", { status: 400 })
  }

  try {
    // Fetch ticket details from API
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/admin/tickets/validate?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: {
          ...adminKeyHeader,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(errorText, { status: response.status })
    }

    const ticketData = await response.json()

    if (!ticketData.valid) {
      return new Response("Ticket not found", { status: 404 })
    }

    // Generate PDF
    const pdfBlob = await generateTicketPdf({
      code: ticketData.code,
      quantity: ticketData.quantity,
      customerName: ticketData.customerName,
      customerEmail: ticketData.customerEmail,
    })

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer()

    // Return PDF as download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${code}.pdf"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Failed to generate ticket PDF:", error)
    return new Response("Failed to generate ticket PDF", { status: 500 })
  }
}
