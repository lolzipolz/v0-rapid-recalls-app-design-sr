"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Plus, Package, AlertTriangle, LogOut, Bell, TrendingUp } from "lucide-react"
import AddProduct from "./add-product"
import RecallAlertCard from "./recall-alert-card"

interface Product {
  id: string
  name: string
  brand: string | null
  model: string | null
  upc: string | null
  purchase_date: string | null
  purchase_price: number | null
  source: string
  created_at: string
}

interface MatchedRecall {
  id: string
  product_id: string
  recall_id: string
  match_type: string
  confidence_score: number
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
  product: Product
  recall: {
    id: string
    title: string
    description: string
    agency: string
    severity: string
    recall_date: string
    link: string
  }
}

interface DashboardProps {
  user: any
}

export default function Dashboard({ user }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [matchedRecalls, setMatchedRecalls] = useState<MatchedRecall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Load products
      const productsResponse = await fetch(`/api/products?userId=${user.id}`, {
        credentials: "include",
      })
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      }

      // Load matched recalls
      const recallsResponse = await fetch(`/api/recalls?userId=${user.id}`, {
        credentials: "include",
      })
      if (recallsResponse.ok) {
        const recallsData = await recallsResponse.json()
        setMatchedRecalls(recallsData.matched_recalls || [])
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include credentials for logout
      })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/")
    }
  }

  const handleProductAdded = () => {
    setShowAddProduct(false)
    loadDashboardData()
  }

  const activeRecalls = matchedRecalls.filter((mr) => !mr.resolved_at)
  const resolvedRecalls = matchedRecalls.filter((mr) => mr.resolved_at)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">RapidRecalls</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
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
        {/* Stats Cards */}
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
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{activeRecalls.length}</div>
              <p className="text-xs text-muted-foreground">Requiring your attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchedRecalls.length}</div>
              <p className="text-xs text-muted-foreground">Total recall matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <p className="text-xs text-muted-foreground">Continuous monitoring for recalls</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Recalls Alert */}
        {activeRecalls.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You have {activeRecalls.length} active recall{activeRecalls.length !== 1 ? "s" : ""} that need your
              attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="recalls" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recalls">
              Recalls{" "}
              {activeRecalls.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeRecalls.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="recalls" className="space-y-4">
            {matchedRecalls.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recalls found</h3>
                    <p className="text-gray-600">Great news! None of your products have been recalled.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeRecalls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Active Recalls</h3>
                    <div className="space-y-4">
                      {activeRecalls.map((matchedRecall) => (
                        <RecallAlertCard
                          key={matchedRecall.id}
                          matchedRecall={matchedRecall}
                          onUpdate={loadDashboardData}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {resolvedRecalls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 mt-8">Resolved Recalls</h3>
                    <div className="space-y-4">
                      {resolvedRecalls.map((matchedRecall) => (
                        <RecallAlertCard
                          key={matchedRecall.id}
                          matchedRecall={matchedRecall}
                          onUpdate={loadDashboardData}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Your Products</h3>
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding products you want to monitor for recalls.</p>
                    <Button onClick={() => setShowAddProduct(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      {product.brand && <CardDescription>{product.brand}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {product.model && (
                          <div>
                            <span className="font-medium">Model:</span> {product.model}
                          </div>
                        )}
                        {product.upc && (
                          <div>
                            <span className="font-medium">UPC:</span> {product.upc}
                          </div>
                        )}
                        {product.purchase_date && (
                          <div>
                            <span className="font-medium">Purchased:</span>{" "}
                            {new Date(product.purchase_date).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {product.source}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Product Modal */}
      {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} onProductAdded={handleProductAdded} />}
    </div>
  )
}
