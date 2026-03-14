"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, Package, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

type ProductStat = {
  name: string
  category: string
  count: number
  revenue: number
}

type Stats = {
  totalRevenue: number
  totalOrders: number
  products: ProductStat[]
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €"
}

export function StatistikClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bar/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const categories = stats?.products
    ? [...new Set(stats.products.map((p) => p.category))]
    : []

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bar Statistik</h1>
        <Button variant="outline" size="lg" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`size-5 ${loading ? "animate-spin" : ""}`} data-icon="inline-start" />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-5 text-emerald-500" />
              Gesamtumsatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">
              {stats ? formatPrice(stats.totalRevenue) : "–"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-5 text-blue-500" />
              Bestellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">
              {stats ? stats.totalOrders : "–"}
            </span>
          </CardContent>
        </Card>
      </div>

      {categories.map((category) => {
        const products = (stats?.products ?? []).filter((p) => p.category === category)
        const categoryTotal = products.reduce((sum, p) => sum + p.revenue, 0)

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{category}</span>
                <Badge variant="secondary" className="text-sm px-3 h-6">
                  {formatPrice(categoryTotal)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {products.map((product) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-sm tabular-nums">
                        {product.count}x
                      </Badge>
                      <span className="text-base font-semibold tabular-nums w-24 text-right">
                        {formatPrice(product.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {stats && (!stats.products || stats.products.length === 0) && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-base">
            Noch keine Verkäufe
          </CardContent>
        </Card>
      )}
    </div>
  )
}
