"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, X, Download, Send, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { TicketRow } from "@/lib/tickets"

function formatDate(dateString: string | null) {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount === null) return "—"
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency ?? "EUR",
  }).format(amount / 100)
}

async function handleDownloadTicket(code: string) {
  try {
    const response = await fetch(`/api/tickets/pdf?code=${encodeURIComponent(code)}`)
    
    if (!response.ok) {
      throw new Error("Failed to download ticket")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ticket-${code}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success("Ticket heruntergeladen")
  } catch (error) {
    console.error("Download error:", error)
    toast.error("Fehler beim Herunterladen")
  }
}

async function handleSendTicket(code: string) {
  const loadingToast = toast.loading("Ticket wird gesendet...", {
    description: `Ticket: ${code}`,
  })

  try {
    const response = await fetch("/api/tickets/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })

    const result = await response.json()

    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success("Ticket erfolgreich gesendet!", {
        description: `An: ${result.email}`,
      })
      // Refresh the page to update the sentAt status
      window.location.reload()
    } else {
      toast.error("Fehler beim Senden", {
        description: result.error || "Unbekannter Fehler",
      })
    }
  } catch (error) {
    toast.dismiss(loadingToast)
    console.error("Send error:", error)
    toast.error("Verbindungsfehler beim Senden")
  }
}

export const columns: ColumnDef<TicketRow>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ticket-Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
        {row.getValue("code")}
      </code>
    ),
  },
  {
    accessorKey: "purchase.customerEmail",
    header: "E-Mail",
    cell: ({ row }) => row.original.purchase.customerEmail ?? "—",
  },
  {
    accessorKey: "purchase.customerName",
    header: "Name",
    cell: ({ row }) => row.original.purchase.customerName ?? "—",
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Anzahl
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("quantity")}</div>
    ),
  },
  {
    accessorKey: "redeemedCount",
    header: "Eingelöst",
    cell: ({ row }) => {
      const redeemed = row.getValue("redeemedCount") as number
      const quantity = row.original.quantity
      const isFullyRedeemed = redeemed >= quantity

      return (
        <div className="flex items-center gap-2">
          <span className={isFullyRedeemed ? "text-green-500" : ""}>
            {redeemed} / {quantity}
          </span>
          {isFullyRedeemed ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : redeemed > 0 ? (
            <span className="text-yellow-500 text-xs">teilweise</span>
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "purchase.status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.purchase.status
      const variant =
        status === "PAID"
          ? "default"
          : status === "PENDING"
            ? "secondary"
            : "destructive"

      return <Badge variant={variant}>{status}</Badge>
    },
    filterFn: (row, _id, value) => {
      return value.includes(row.original.purchase.status)
    },
  },
  {
    accessorKey: "purchase.amountTotal",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Betrag
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      formatCurrency(
        row.original.purchase.amountTotal,
        row.original.purchase.currency
      ),
  },
  {
    accessorKey: "sentAt",
    header: "Versendet",
    cell: ({ row }) => {
      const sentAt = row.original.sentAt
      if (sentAt) {
        return (
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(sentAt)}
            </TooltipContent>
          </Tooltip>
        )
      }
      return <span className="text-muted-foreground">—</span>
    },
  },
  {
    id: "actions",
    header: "Aktionen",
    cell: ({ row }) => {
      const code = row.original.code
      const sentAt = row.original.sentAt

      return (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDownloadTicket(code)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ticket herunterladen</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${sentAt ? "text-green-500" : ""}`}
                onClick={() => handleSendTicket(code)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sentAt ? "Erneut verschicken" : "Ticket verschicken"}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
