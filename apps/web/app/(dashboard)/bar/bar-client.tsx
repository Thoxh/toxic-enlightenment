"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Trash2, Receipt, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { drinkCategories, type Drink } from "@/lib/bar-drinks"

type CartItem = {
  id: string
  name: string
  price: number
  category: string
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €"
}

export function BarClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState<{
    totalRevenue: number
    totalOrders: number
  } | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/bar/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  function addToCart(drink: Drink, categoryName: string) {
    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: drink.name,
        price: drink.price,
        category: categoryName,
      },
    ])
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  async function submitOrder() {
    if (cart.length === 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/bar/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            name: item.name,
            price: item.price,
            category: item.category,
          })),
        }),
      })

      if (res.ok) {
        toast.success("Bestellung quittiert")
        setCart([])
        fetchStats()
      } else {
        toast.error("Fehler beim Quittieren")
      }
    } catch {
      toast.error("Verbindung fehlgeschlagen")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)
  const activeDrinks = selectedCategory
    ? drinkCategories.find((c) => c.name === selectedCategory)?.drinks ?? []
    : []

  const categoryStyles: Record<string, { icon: string; bg: string; border: string; hover: string }> = {
    Alkoholfrei: { icon: "💧", bg: "bg-sky-500/8", border: "border-sky-500/20", hover: "hover:bg-sky-500/15 hover:border-sky-500/35" },
    Bier: { icon: "🍺", bg: "bg-amber-500/8", border: "border-amber-500/20", hover: "hover:bg-amber-500/15 hover:border-amber-500/35" },
    Cocktails: { icon: "🍹", bg: "bg-rose-500/8", border: "border-rose-500/20", hover: "hover:bg-rose-500/15 hover:border-rose-500/35" },
    "Long Drinks": { icon: "🥃", bg: "bg-violet-500/8", border: "border-violet-500/20", hover: "hover:bg-violet-500/15 hover:border-violet-500/35" },
    Shots: { icon: "🥂", bg: "bg-emerald-500/8", border: "border-emerald-500/20", hover: "hover:bg-emerald-500/15 hover:border-emerald-500/35" },
  }

  const drinkColorMap: Record<string, { bg: string; border: string; hover: string }> = {
    Alkoholfrei: { bg: "bg-sky-500/6", border: "border-sky-500/15", hover: "hover:bg-sky-500/12 hover:border-sky-500/30" },
    Bier: { bg: "bg-amber-500/6", border: "border-amber-500/15", hover: "hover:bg-amber-500/12 hover:border-amber-500/30" },
    Cocktails: { bg: "bg-rose-500/6", border: "border-rose-500/15", hover: "hover:bg-rose-500/12 hover:border-rose-500/30" },
    "Long Drinks": { bg: "bg-violet-500/6", border: "border-violet-500/15", hover: "hover:bg-violet-500/12 hover:border-violet-500/30" },
    Shots: { bg: "bg-emerald-500/6", border: "border-emerald-500/15", hover: "hover:bg-emerald-500/12 hover:border-emerald-500/30" },
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Stats card */}
        <Card size="sm" className="mb-5">
          <CardContent className="flex items-center justify-between py-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-500" />
              <span className="text-base font-medium text-muted-foreground">
                Umsatz
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {stats ? formatPrice(stats.totalRevenue) : "–"}
            </span>
          </CardContent>
        </Card>

        {selectedCategory === null ? (
          /* Category grid */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {drinkCategories.map((cat) => {
              const style = categoryStyles[cat.name] ?? { icon: "🍸", bg: "bg-muted/10", border: "border-border/50", hover: "hover:bg-muted/20" }
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-card-foreground transition-all active:scale-[0.97] ${style.bg} ${style.border} ${style.hover}`}
                >
                  <span className="text-5xl">{style.icon}</span>
                  <span className="text-lg font-semibold">{cat.name}</span>
                  <Badge variant="secondary" className="text-sm px-3 h-6">{cat.drinks.length} Getränke</Badge>
                </button>
              )
            })}
            <button
              onClick={() => addToCart({ name: "Pfand", price: 200, ingredients: [] }, "Pfand")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-card-foreground transition-all active:scale-[0.97] bg-orange-500/8 border-orange-500/20 hover:bg-orange-500/15 hover:border-orange-500/35"
            >
              <span className="text-5xl">♻️</span>
              <span className="text-lg font-semibold">Pfand</span>
              <Badge variant="secondary" className="text-sm px-3 h-6">2,00 €</Badge>
            </button>
            <button
              onClick={() => addToCart({ name: "Pfandrückgabe", price: -200, ingredients: [] }, "Pfand")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-card-foreground transition-all active:scale-[0.97] bg-teal-500/8 border-teal-500/20 hover:bg-teal-500/15 hover:border-teal-500/35"
            >
              <span className="text-5xl">🔄</span>
              <span className="text-lg font-semibold">Pfandrückgabe</span>
              <Badge variant="secondary" className="text-sm px-3 h-6">-2,00 €</Badge>
            </button>
          </div>
        ) : (
          /* Drink grid */
          <>
            <Button
              variant="outline"
              onClick={() => setSelectedCategory(null)}
              className="mb-4 text-lg h-12 px-5 gap-2"
            >
              <ArrowLeft className="size-6" data-icon="inline-start" />
              Zurück
            </Button>

            <h2 className="mb-4 text-xl font-semibold">{selectedCategory}</h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {activeDrinks.map((drink) => {
                const dc = drinkColorMap[selectedCategory] ?? { bg: "bg-muted/10", border: "border-border/50", hover: "hover:bg-muted/20" }
                return (
                  <button
                    key={drink.name}
                    onClick={() => addToCart(drink, selectedCategory)}
                    className={`flex flex-col items-start justify-between gap-3 rounded-2xl border p-7 text-left text-card-foreground transition-all active:scale-[0.97] ${dc.bg} ${dc.border} ${dc.hover}`}
                  >
                    <span className="text-2xl font-bold">{drink.name}</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {formatPrice(drink.price)}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Cart sidebar */}
      <div className="flex w-80 shrink-0 flex-col border-l border-border/50 bg-card/50">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-base font-semibold">Warenkorb</h3>
          {cart.length > 0 && (
            <Badge variant="secondary" className="text-sm px-3 h-6">{cart.length}</Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-base text-muted-foreground">
              Keine Artikel
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {cart.map((item) => (
                <button
                  key={item.id}
                  onClick={() => removeFromCart(item.id)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-destructive/10 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-base tabular-nums font-medium">
                      {formatPrice(item.price)}
                    </span>
                    <Trash2 className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Gesamt</span>
            <span className="text-xl font-bold tabular-nums">
              {formatPrice(cartTotal)}
            </span>
          </div>

          <Button
            className="w-full h-14 text-lg"
            disabled={cart.length === 0 || isSubmitting}
            onClick={submitOrder}
          >
            <Receipt className="size-6" data-icon="inline-start" />
            {isSubmitting ? "Wird quittiert..." : "Quittieren"}
          </Button>
        </div>
      </div>
    </div>
  )
}
