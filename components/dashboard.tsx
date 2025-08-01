"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Package, AlertTriangle, Plus, LogOut, Bell, TrendingUp, Activity } from "lucide-react"
import AddProduct from "@/components/add-product"
import RecallAlertCard from "@/components/recall-alert-card"

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
  title: string
  description: string
  agency: string
  severity: string
  recall_date: string
  link: string
  match_type: string
  confidence_score: number
  acknowledged_at?: string
  resolved_at?: string
  product_name: string
}

export default function Dashboard({ user }: { user: User }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Load products
      const productsResponse = await fetch("/api/products", {
        credentials: "include",
      })
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      }

      // Load recalls
      const recallsResponse = await fetch("/api/recalls", {
        credentials: "include",
      })
      if (recallsResponse.ok) {
        const recallsData = await recallsResponse.json()
        setRecalls(recallsData.recalls || [])
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const activeRecalls = recalls.filter((r) => !r.resolved_at)
  const highSeverityRecalls = recalls.filter((r) => r.severity === "high" && !r.resolved_at)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">RapidRecalls</h1>
                <p className="text-sm text-gray-500">Product Safety Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">Last login: {new Date(user.last_login).toLocaleDateString()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">Products being monitored</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Recalls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{activeRecalls.length}</div>
              <p className="text-xs text-muted-foreground">Requiring your attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{highSeverityRecalls.length}</div>
              <p className="text-xs text-muted-foreground">Critical safety alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protection Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{products.length > 0 ? "98%" : "0%"}</div>
              <p className="text-xs text-muted-foreground">Coverage effectiveness</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your products and stay protected from recalls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Import from Receipt
              </Button>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>{products.length} products being monitored for recalls</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500 mb-4">Add your first product to start monitoring for recalls</p>
                  <Button onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {product.brand && <span>{product.brand}</span>}
                          {product.model && <span>• {product.model}</span>}
                          <Badge variant="secondary" className="text-xs">
                            {product.source}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Added {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {products.length > 5 && (
                    <Button variant="outline" className="w-full bg-transparent">
                      View All {products.length} Products
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Recalls */}
          <Card>
            <CardHeader>
              <CardTitle>Recall Alerts</CardTitle>
              <CardDescription>{activeRecalls.length} active recalls affecting your products</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : activeRecalls.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                  <p className="text-gray-500">
                    No active recalls found for your products. We'll notify you immediately if any recalls are issued.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRecalls.slice(0, 3).map((recall) => (
                    <RecallAlertCard key={recall.id} recall={recall} onUpdate={loadDashboardData} />
                  ))}
                  {activeRecalls.length > 3 && (
                    <Button variant="outline" className="w-full bg-transparent">
                      View All {activeRecalls.length} Recalls
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProduct
          onClose={() => setShowAddProduct(false)}
          onProductAdded={() => {
            setShowAddProduct(false)
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}
