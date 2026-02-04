"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import type { TicketRow } from "@/lib/tickets"

interface TicketsClientProps {
  initialData: TicketRow[]
}

// Maximum tickets that can be sold
const MAX_TICKETS = 150
const PROGRESS_SEGMENTS = 24

interface KpiCardProps {
  title: string
  value: number
  maxValue: number
  suffix?: string
  valueColor?: string
  trendPercentage?: number
}

// Segmented Progress Bar Component - taller segments, full width
function SegmentedProgress({ value, maxValue, color = "bg-blue-500" }: { value: number; maxValue: number; color?: string }) {
  const filledSegments = Math.round((value / maxValue) * PROGRESS_SEGMENTS)
  
  return (
    <div className="flex gap-1 w-full">
      {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
        <div
          key={i}
          className={`h-4 flex-1 rounded-sm transition-colors ${
            i < filledSegments ? color : "bg-muted/30"
          }`}
        />
      ))}
    </div>
  )
}

function KpiCard({ title, value, maxValue, suffix, valueColor, trendPercentage }: KpiCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-semibold tracking-tight ${valueColor ?? ""}`}>
              {value}
            </span>
            {suffix && (
              <span className="text-sm text-muted-foreground">{suffix}</span>
            )}
          </div>
          {trendPercentage !== undefined && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-500">
              <TrendingUp className="size-3" />
              +{trendPercentage.toFixed(1)}%
            </span>
          )}
        </div>
        <SegmentedProgress 
          value={value} 
          maxValue={maxValue} 
          color={valueColor === "text-green-500" ? "bg-green-500" : "bg-blue-500"} 
        />
      </CardContent>
    </Card>
  )
}

export function TicketsClient({ initialData }: TicketsClientProps) {
  const router = useRouter()
  const [data, setData] = React.useState<TicketRow[]>(initialData)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const totalTickets = data.length
  const totalRedeemed = data.reduce((sum, t) => sum + t.redeemedCount, 0)
  const totalQuantity = data.reduce((sum, t) => sum + t.quantity, 0)
  const totalRevenue = data.reduce(
    (sum, t) => sum + (t.purchase.amountTotal ?? 0),
    0
  )

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      router.refresh()
      toast.success("Daten aktualisiert")
    } catch {
      toast.error("Fehler beim Aktualisieren")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Sync with server data on refresh
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Calculate trend percentage for redeemed
  const redemptionRate = totalQuantity > 0 ? (totalRedeemed / totalQuantity) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Tickets verkauft"
          value={totalQuantity}
          maxValue={MAX_TICKETS}
          suffix={`/ ${MAX_TICKETS}`}
        />
        <KpiCard
          title="Eingecheckt"
          value={totalRedeemed}
          maxValue={totalQuantity || 1}
          suffix={`/ ${totalQuantity}`}
          valueColor="text-green-500"
          trendPercentage={redemptionRate > 0 ? redemptionRate : undefined}
        />
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Umsatz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(totalRevenue / 100)}
              </span>
            </div>
            <SegmentedProgress value={totalQuantity} maxValue={MAX_TICKETS} color="bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Alle Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </CardContent>
      </Card>
    </div>
  )
}
