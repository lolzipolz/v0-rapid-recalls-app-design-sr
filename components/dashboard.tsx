"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Plus, Package, Bell, AlertTriangle, CheckCircle, LogOut, Loader2, User } from "lucide-react"
import AddProduct from "@/components/add-product"
import { useRouter } from "next/navigation"

interface DashboardProps {
  user: {
    id: string
    email: string
    notification_preferences: any
    created_at: string
    last_login: string
  }
}

export function Dashboard({ user }: DashboardProps) {
  const [products, setProducts] = useState([])
  const [recalls, setRecalls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

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
      setError("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
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
    loadData()
    setShowAddProduct(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RapidRecalls</h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
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
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products Tracked</p>
                  <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Recalls</p>
                  <p className="text-3xl font-bold text-red-600">{recalls.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monitoring Status</p>
                  <p className="text-lg font-semibold text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </p>
                </div>
                <Bell className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>Products being monitored for recalls</CardDescription>
                </div>
                <Button onClick={() => setShowAddProduct(true)}>
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
                <div className="space-y-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          {product.brand && <p className="text-sm text-gray-600">Brand: {product.brand}</p>}
                          {product.model && <p className="text-sm text-gray-600">Model: {product.model}</p>}
                          <p className="text-xs text-gray-500 mt-2">
                            Added {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Monitoring
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recalls Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Recalls</CardTitle>
              <CardDescription>Latest product recalls that might affect you</CardDescription>
            </CardHeader>
            <CardContent>
              {recalls.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active recalls</h3>
                  <p className="text-gray-600">Great news! None of your products have active recalls.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recalls.map((recall: any) => (
                    <div key={recall.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-900">{recall.title}</h4>
                          <p className="text-sm text-red-700 mt-1">{recall.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="destructive">{recall.agency}</Badge>
                            <span className="text-xs text-red-600">
                              {new Date(recall.recall_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} onProductAdded={handleProductAdded} />}
    </div>
  )
}
