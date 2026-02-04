export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      time: new Date().toISOString(),
      env: process.env.NODE_ENV ?? "unknown",
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  )
}
