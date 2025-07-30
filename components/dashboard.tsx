"use client"

import { useState, useEffect } from "react"
import { Shield, Package, AlertTriangle, Plus, Bell, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/components/user-provider"

interface DashboardProps {
  onAddProduct: () => void
}

interface Product {
  id: string
  name: string
  brand?: string
  upc?: string
  purchase_date?: string
  created_at: string
}

interface MatchedRecall {
  id: string
  product_name: string
  product_brand?: string
  recall_title: string
  agency: string
  severity: "low" | "medium" | "high"
  description?: string
  recall_date: string
  link?: string
  confidence_score: number
  match_type: string
  acknowledged_at?: string
  resolved_at?: string
}

export function Dashboard({ onAddProduct }: DashboardProps) {
  const { user } = useUser()
  const [products, setProducts] = useState<Product[]>([])
  const [recalls, setRecalls] = useState<MatchedRecall[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      const [productsRes, recallsRes] = await Promise.all([
        fetch(`/api/products?userId=${user.id}`),
        fetch(`/api/recalls?userId=${user.id}`),
      ])

      if (productsRes.ok) {
        const { products } = await productsRes.json()
        setProducts(products)
      }

      if (recallsRes.ok) {
        const { recalls } = await recallsRes.json()
        setRecalls(recalls)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledgeRecall = async (recallId: string) => {
    try {
      const response = await fetch(`/api/recalls/${recallId}/acknowledge`, {
        method: "POST",
      })

      if (response.ok) {
        setRecalls((prev) =>
          prev.map((recall) =>
            recall.id === recallId ? { ...recall, acknowledged_at: new Date().toISOString() } : recall,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to acknowledge recall:", error)
    }
  }

  const handleResolveRecall = async (recallId: string) => {
    try {
      const response = await fetch(`/api/recalls/${recallId}/resolve`, {
        method: "POST",
      })

      if (response.ok) {
        setRecalls((prev) =>
          prev.map((recall) =>
            recall.id === recallId ? { ...recall, resolved_at: new Date().toISOString() } : recall,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to resolve recall:", error)
    }
  }

  const activeRecalls = recalls.filter((r) => !r.resolved_at)
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityIcon = (severity: string) => {
    const iconClass =
      severity === "high" ? "text-red-600" : severity === "medium" ? "text-yellow-600" : "text-orange-600"
    return <AlertTriangle className={`w-5 h-5 ${iconClass} flex-shrink-0`} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RapidRecalls</h1>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {activeRecalls.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  <p className="text-sm text-gray-600">Products Monitored</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeRecalls.length}</p>
                  <p className="text-sm text-gray-600">Active Recalls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Recalls Alert */}
        {activeRecalls.length > 0 && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">⚠️ Recall Alert</p>
                  <p className="text-sm text-red-700">
                    You have {activeRecalls.length} product(s) with active recalls that need your attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Monitoring Your Products</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add products to your watchlist and we'll alert you if they're ever recalled
              </p>
              <Button onClick={onAddProduct} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      {products.length > 0 && (
        <div className="px-4">
          <Tabs defaultValue="recalls" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-xl p-1">
              <TabsTrigger value="recalls" className="rounded-lg">
                Recalls {activeRecalls.length > 0 && `(${activeRecalls.length})`}
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg">
                Products
              </TabsTrigger>
              <TabsTrigger value="add" className="rounded-lg">
                Add New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recalls" className="space-y-3">
              {activeRecalls.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">🎉 All Clear!</h3>
                    <p className="text-sm text-gray-600">No active recalls found for your products</p>
                  </CardContent>
                </Card>
              ) : (
                activeRecalls.map((recall) => (
                  <Card
                    key={recall.id}
                    className={`border-0 shadow-sm ${
                      recall.severity === "high"
                        ? "bg-red-50 border-red-200"
                        : recall.severity === "medium"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <CardContent className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(recall.severity)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 leading-tight">{recall.product_name}</h3>
                            <Badge className={`${getSeverityColor(recall.severity)} capitalize`}>
                              {recall.severity} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Issued by {recall.agency} • {Math.round(recall.confidence_score * 100)}% match
                          </p>
                          <p className="text-xs text-gray-500">{recall.recall_date}</p>
                        </div>
                      </div>

                      {/* Recall Details */}
                      <div className="bg-white/60 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-1">{recall.recall_title}</h4>
                        {recall.description && (
                          <p className="text-sm text-gray-700 leading-relaxed">{recall.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {recall.link && (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 rounded-lg border-gray-300 bg-white/80"
                            onClick={() => window.open(recall.link, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Official Notice
                          </Button>
                        )}
                        {!recall.acknowledged_at && (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 rounded-lg border-gray-300 bg-white/80"
                            onClick={() => handleAcknowledgeRecall(recall.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Seen
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 h-10 rounded-lg border-gray-300 bg-white/80"
                          onClick={() => handleResolveRecall(recall.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-3">
              {products.map((product) => (
                <Card key={product.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
                        {product.upc && <p className="text-xs text-gray-500 font-mono">UPC: {product.upc}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Added {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Monitoring
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <Button onClick={onAddProduct} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add New Product
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
