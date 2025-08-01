"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Package, Bell, AlertTriangle, Plus, LogOut, Loader2, Mail } from "lucide-react"
import AddProduct from "@/components/add-product"

interface User {
  id: string
  email: string
  notification_preferences: any
  created_at: string
  last_login: string
}

interface WelcomeScreenProps {
  user: User
  onProductAdded: () => void
}

export default function WelcomeScreen({ user, onProductAdded }: WelcomeScreenProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Magic link sent! Check your email to sign in.")
        setIsSuccess(true)
      } else {
        setMessage(data.error || "Failed to send magic link")
        setIsSuccess(false)
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
      setIsSuccess(false)
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
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleProductAdded = () => {
    setShowAddProduct(false)
    onProductAdded()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to RapidRecalls!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Stay protected with instant alerts about product recalls that affect your purchases.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle>1. Add Your Products</CardTitle>
              <CardDescription>Upload receipts or manually add products you've purchased</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <CardTitle>2. We Monitor Recalls</CardTitle>
              <CardDescription>Our system continuously checks for recalls affecting your products</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle>3. Get Instant Alerts</CardTitle>
              <CardDescription>Receive immediate notifications when recalls match your products</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Get Started */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Add your first product to begin receiving recall alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" className="text-lg px-8 py-3" onClick={() => setShowAddProduct(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Smart Matching</h3>
              <p className="text-gray-600">Advanced algorithms match recalls to your specific products</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Real-time Alerts</h3>
              <p className="text-gray-600">Get notified immediately when new recalls are announced</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Easy Management</h3>
              <p className="text-gray-600">Simple interface to track and manage all your products</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Comprehensive Coverage</h3>
              <p className="text-gray-600">Monitor recalls from FDA, CPSC, NHTSA, and other agencies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} onProductAdded={handleProductAdded} />}

      {!isSuccess ? (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to RapidRecalls</CardTitle>
              <CardDescription>Enter your email to get started with product recall monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
              {message && !isSuccess && <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg">{message}</div>}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Check your email!</p>
              <p className="text-green-700 text-sm mt-1">We've sent a magic link to {email}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccess(false)
                setEmail("")
                setMessage("")
              }}
            >
              Use Different Email
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
