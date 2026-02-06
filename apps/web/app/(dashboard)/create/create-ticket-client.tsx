"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ticket, Mail, User, Users, Euro, FileText, Loader2, Check, Copy } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

interface CreateTicketResult {
  success: boolean
  error?: string
  ticket?: {
    id: string
    code: string
    quantity: number
    customerEmail: string
    customerName: string | null
  }
}

export function CreateTicketClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [createdTicket, setCreatedTicket] = React.useState<CreateTicketResult["ticket"] | null>(null)

  const [formData, setFormData] = React.useState({
    customerEmail: "",
    customerName: "",
    quantity: 1,
    amountTotal: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setCreatedTicket(null)

    try {
      const response = await fetch("/api/tickets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          customerName: formData.customerName || undefined,
          quantity: formData.quantity,
          amountTotal: formData.amountTotal ? Math.round(parseFloat(formData.amountTotal) * 100) : undefined,
          currency: "EUR",
          notes: formData.notes || undefined,
        }),
      })

      const result: CreateTicketResult = await response.json()

      if (result.success && result.ticket) {
        setCreatedTicket(result.ticket)
        toast.success("Ticket erstellt!", {
          description: `Code: ${result.ticket.code}`,
        })
        // Reset form
        setFormData({
          customerEmail: "",
          customerName: "",
          quantity: 1,
          amountTotal: "",
          notes: "",
        })
      } else {
        toast.error("Fehler beim Erstellen", {
          description: result.error || "Unbekannter Fehler",
        })
      }
    } catch (error) {
      console.error("Create error:", error)
      toast.error("Verbindungsfehler")
    } finally {
      setIsLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("In Zwischenablage kopiert")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Neues Ticket erstellen
            </CardTitle>
            <CardDescription className="text-xs">
              Erstelle manuell ein Ticket ohne Stripe-Zahlung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  E-Mail-Adresse *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kunde@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  required
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Name (optional)
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center gap-2 text-sm">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Anzahl Gäste *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Wie viele Personen dürfen mit diesem Ticket eintreten (1-10)
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2 text-sm">
                  <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                  Betrag (optional)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0.00"
                  value={formData.amountTotal}
                  onChange={(e) => setFormData({ ...formData, amountTotal: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Für Statistik-Zwecke (z.B. Barzahlung)
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Notizen (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Interne Notizen zum Ticket..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Ticket erstellen
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-medium">Erstelltes Ticket</CardTitle>
            <CardDescription className="text-xs">
              Details zum zuletzt erstellten Ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createdTicket ? (
              <div className="space-y-4">
                {/* Success Banner */}
                <div className="p-4 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-3">
                  <Check className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-semibold">Ticket erfolgreich erstellt</p>
                    <p className="text-sm opacity-80">
                      Das Ticket kann jetzt verwendet werden
                    </p>
                  </div>
                </div>

                {/* Ticket Code */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Ticket-Code
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-4 py-3 font-mono text-xl font-bold tracking-wider">
                      {createdTicket.code}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(createdTicket.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">E-Mail</span>
                    <span>{createdTicket.customerEmail}</span>
                  </div>
                  {createdTicket.customerName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span>{createdTicket.customerName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Anzahl Gäste</span>
                    <span>{createdTicket.quantity}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/tickets")}
                  >
                    Alle Tickets anzeigen
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.open(`/api/tickets/pdf?code=${createdTicket.code}`, "_blank")
                    }}
                  >
                    PDF herunterladen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">
                  Erstelle ein Ticket um die Details hier zu sehen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
