"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RecallAlertCard } from "@/components/recall-alert-card"
import { Shield, Plus, Package, AlertTriangle, CheckCircle, Settings, LogOut, Bell, TrendingUp } from "lucide-react"

interface User {
  id: string
  email: string
  notification_preferences: any
  created_at: string
  last_login: string
}

interface Product {
  id: string
  name: string
  brand?: string
  model?: string
  upc?: string
  purchase_date?: string
  purchase_price?: number
  source: string
  created_at: string
}

interface Recall {
  id: string
  product_name: string
  product_brand?: string
  recall_title: string
  agency: string
  severity: "high" | "medium" | "low"
  description: string
  recall_date: string
  link: string
  confidence_score: number
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        // Load products
        const productsResponse = await fetch(`/api/products?userId=${user.id}`)
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData.products || [])
        }

        // Load recalls
        const recallsResponse = await fetch(`/api/recalls?userId=${user.id}`)
        if (recallsResponse.ok) {
          const recallsData = await recallsResponse.json()
          setRecalls(recallsData.recalls || [])
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user.id])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const activeRecalls = recalls.filter((r) => !r.resolved_at)
  const highPriorityRecalls = activeRecalls.filter((r) => r.severity === "high")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RapidRecalls</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Recalls</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRecalls.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{highPriorityRecalls.length}</p>
                </div>
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monitoring</p>
                  <p className="text-2xl font-bold text-green-600">24/7</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Recalls */}
        {activeRecalls.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Active Recalls</h2>
              <Badge variant="destructive">{activeRecalls.length} Active</Badge>
            </div>
            <div className="space-y-4">
              {activeRecalls.slice(0, 3).map((recall) => (
                <RecallAlertCard key={recall.id} recall={recall} />
              ))}
              {activeRecalls.length > 3 && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-gray-600">{activeRecalls.length - 3} more active recalls</p>
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      View All Recalls
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Products</CardTitle>
                  <CardDescription>{products.length} products being monitored</CardDescription>
                </div>
                <Button onClick={() => router.push("/add-product")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">Add your first product to start monitoring for recalls</p>
                  <Button onClick={() => router.push("/add-product")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
                      </div>
                      <Badge variant="outline">{product.source}</Badge>
                    </div>
                  ))}
                  {products.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm">
                        View All {products.length} Products
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {recalls.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                  <p className="text-gray-600">No recalls found for your products. We're monitoring 24/7.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recalls.slice(0, 5).map((recall) => (
                    <div key={recall.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          recall.severity === "high"
                            ? "bg-red-500"
                            : recall.severity === "medium"
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{recall.recall_title}</p>
                        <p className="text-xs text-gray-600">
                          {recall.agency} • {new Date(recall.recall_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
