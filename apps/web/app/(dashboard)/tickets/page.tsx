import { getTickets } from "@/lib/tickets"
import { TicketsClient } from "./tickets-client"

export const dynamic = "force-dynamic"

export default async function TicketsPage() {
  const { data: tickets } = await getTickets()

  return <TicketsClient initialData={tickets} />
}
