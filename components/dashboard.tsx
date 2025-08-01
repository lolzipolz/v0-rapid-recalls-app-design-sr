"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, AlertTriangle, CheckCircle, LogOut, Bell, Shield, TrendingUp } from "lucide-react"
import AddProduct from "@/components/add-product"
import { RecallAlertCard } from "@/components/recall-alert-card"

interface User {
  id: string
  email: string
  created_at: string
}

interface Product {
  id: string
  name: string
  brand?: string
  model?: string
  upc?: string
  purchase_date?: string
  purchase_price?: number
  created_at: string
}

interface Recall {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  date_published: string
  source: string
  product_name: string
  brand?: string
  model?: string
  upc?: string
  status: "new" | "acknowledged" | "resolved"
  matched_products: string[]
}

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
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
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
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

  const handleProductAdded = () => {
    setShowAddProduct(false)
    loadData()
  }

  const activeRecalls = recalls.filter((r) => r.status === "new")
  const acknowledgedRecalls = recalls.filter((r) => r.status === "acknowledged")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">RapidRecalls</h1>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products Monitored</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{activeRecalls.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{acknowledgedRecalls.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Protection Score</p>
                  <p className="text-2xl font-bold text-blue-600">98%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Recalls */}
        {activeRecalls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 text-red-600 mr-2" />
              Active Recall Alerts ({activeRecalls.length})
            </h2>
            <div className="space-y-4">
              {activeRecalls.map((recall) => (
                <RecallAlertCard key={recall.id} recall={recall} onUpdate={loadData} />
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Products */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>Products you're monitoring for recalls</CardDescription>
                </div>
                <Button onClick={() => setShowAddProduct(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">Add your first product to start monitoring for recalls</p>
                  <Button onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
                        {product.model && <p className="text-xs text-gray-500">Model: {product.model}</p>}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Monitoring
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and system activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">System monitoring active</p>
                    <p className="text-xs text-gray-500">Checking for new recalls every hour</p>
                  </div>
                </div>

                {products.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Products synchronized</p>
                      <p className="text-xs text-gray-500">{products.length} products being monitored</p>
                    </div>
                  </div>
                )}

                {activeRecalls.length === 0 && products.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">All clear</p>
                      <p className="text-xs text-gray-500">No active recalls for your products</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <AddProduct onSuccess={handleProductAdded} onCancel={() => setShowAddProduct(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
