"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Mail, Loader2, CheckCircle, AlertTriangle, Bell, Zap, ArrowRight, Package, Search } from "lucide-react"
import WelcomeScreen from "@/components/welcome-screen"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Check for error messages from URL params
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "invalid-token":
          setError("Invalid or missing verification token")
          break
        case "expired-token":
          setError("Verification link has expired. Please request a new one.")
          break
        case "verification-failed":
          setError("Verification failed. Please try again.")
          break
        default:
          setError("An error occurred during verification")
      }
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        // In development, show the magic link
        if (data.magicLink) {
          setMessage(`${data.message}\n\nDevelopment link: ${data.magicLink}`)
        }
      } else {
        setError(data.error || "Failed to send magic link")
      }
    } catch (error) {
      console.error("Magic link error:", error)
      setError("Failed to send magic link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (user) {
    return <WelcomeScreen user={user} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RapidRecalls
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Never Miss a
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Product Recall
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get instant alerts when your products are recalled. Protect your family with real-time notifications from
              FDA, CPSC, NHTSA, and USDA.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Zap className="h-4 w-4 mr-2" />
                Instant Alerts
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                FDA + CPSC + NHTSA
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Bell className="h-4 w-4 mr-2" />
                Email + Push Notifications
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="max-w-md mx-auto px-4 pb-16">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started Free</CardTitle>
            <CardDescription>
              Enter your email to create your account and start monitoring your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>

            {message && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 whitespace-pre-line">{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              No passwords required. We'll send you a secure login link via email.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How RapidRecalls Protects You</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our advanced monitoring system tracks millions of products and alerts you instantly when recalls are issued.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Products</h3>
              <p className="text-gray-600">
                Quickly add products by name, scan barcodes, or upload receipts. We'll automatically match them to our
                database.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Continuous Monitoring</h3>
              <p className="text-gray-600">
                Our AI monitors FDA, CPSC, NHTSA, and USDA databases 24/7, checking for recalls that match your
                products.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Alerts</h3>
              <p className="text-gray-600">
                Get notified immediately via email and push notifications when recalls affect your products. Take action
                fast.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50M+</div>
              <div className="text-gray-600">Products Monitored</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">{"<"}5min</div>
              <div className="text-gray-600">Average Alert Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Protect Your Family?</h2>
        <p className="text-lg text-gray-600 mb-8">
          Join thousands of families who trust RapidRecalls to keep them safe from dangerous products.
        </p>
        <Button size="lg" className="text-lg px-8 py-3">
          Get Started Free
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">RapidRecalls</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 RapidRecalls. All rights reserved.</p>
            <p className="mt-2">Keeping families safe, one product at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
