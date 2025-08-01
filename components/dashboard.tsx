"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, LogOut, Bell, Package, AlertTriangle } from "lucide-react"
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
  brand: string
  model: string
  upc: string
  purchase_date: string
  purchase_price: number
  source: string
}

interface Recall {
  id: string
  title: string
  description: string
  agency: string
  severity: string
  recall_date: string
  link: string
}

interface MatchedRecall {
  id: string
  product: Product
  recall: Recall
  match_type: string
  confidence_score: number
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
}

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [matchedRecalls, setMatchedRecalls] = useState<MatchedRecall[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [loading, setLoading] = useState(true)

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

      // Load matched recalls
      const recallsResponse = await fetch("/api/recalls", {
        credentials: "include",
      })
      if (recallsResponse.ok) {
        const recallsData = await recallsResponse.json()
        setMatchedRecalls(recallsData.matched_recalls || [])
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
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleProductAdded = () => {
    setShowAddProduct(false)
    loadData()
  }

  const activeRecalls = matchedRecalls.filter((mr) => !mr.resolved_at)
  const resolvedRecalls = matchedRecalls.filter((mr) => mr.resolved_at)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">RapidRecalls</h1>
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
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Recalls</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRecalls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{resolvedRecalls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Safety Score</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRecalls.length === 0 ? "100%" : "85%"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Recalls */}
        {activeRecalls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Active Recall Alerts
            </h2>
            <div className="space-y-4">
              {activeRecalls.map((matchedRecall) => (
                <RecallAlertCard key={matchedRecall.id} matchedRecall={matchedRecall} onUpdate={loadData} />
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Add your products to start receiving recall alerts</p>
                <Button onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>
                      {product.brand} {product.model && `- ${product.model}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {product.upc && <p className="text-sm text-gray-600">UPC: {product.upc}</p>}
                      {product.purchase_date && (
                        <p className="text-sm text-gray-600">
                          Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                        </p>
                      )}
                      {product.purchase_price && (
                        <p className="text-sm text-gray-600">Price: ${product.purchase_price}</p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {product.source}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Recalls */}
        {resolvedRecalls.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 text-green-600 mr-2" />
              Resolved Recalls
            </h2>
            <div className="space-y-4">
              {resolvedRecalls.map((matchedRecall) => (
                <RecallAlertCard key={matchedRecall.id} matchedRecall={matchedRecall} onUpdate={loadData} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} onProductAdded={handleProductAdded} />}
    </div>
  )
}
