"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
  Bell,
  Search,
  Zap,
  Users,
  Star,
  ArrowRight,
  Smartphone,
  Car,
  Home,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [magicLink, setMagicLink] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.log("Not authenticated")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setError("")
    setMagicLink("")

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        if (data.magicLink) {
          setMagicLink(data.magicLink)
        }
      } else {
        setError(data.error || "Failed to send magic link")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RapidRecalls
                </h1>
                <p className="text-xs text-gray-500">Stay Safe. Stay Informed.</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Monitoring
            </Badge>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-12 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors">
              <Zap className="w-3 h-3 mr-1" />
              Instant Recall Alerts
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Never Miss a{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Product Recall
              </span>{" "}
              Again
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Track your products and get instant notifications when recalls are issued. Our AI monitors FDA, CPSC, and
              USDA databases 24/7 to keep your family safe.
            </p>

            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">10K+</div>
                <div className="text-sm text-gray-500">Products Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-500">Recalls Detected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                <Mail className="h-6 w-6 text-blue-600" />
                <span>Get Started Free</span>
              </CardTitle>
              <CardDescription className="text-base">Enter your email to receive a secure login link</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Magic Link...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Send Magic Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Success Message */}
              {message && (
                <Alert className="mt-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">{message}</AlertDescription>
                </Alert>
              )}

              {/* Development Magic Link */}
              {magicLink && (
                <Alert className="mt-4 border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-2">
                      <p className="font-medium">Development Mode - Magic Link:</p>
                      <a href={magicLink} className="text-blue-600 hover:text-blue-800 underline break-all text-sm">
                        Click here to login
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-center text-sm text-gray-500 mt-4">
                No passwords required. Just click the link we send you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Smart Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI automatically matches your products with recall databases using advanced fuzzy matching
                algorithms.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Instant Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Get notified within minutes when any of your products are recalled by FDA, CPSC, or USDA.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Family Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep your loved ones safe with comprehensive monitoring of food, toys, electronics, and more.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product Categories */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">We Monitor Everything</h2>
          <p className="text-xl text-gray-600 mb-8">From electronics to food, we've got you covered</p>

          <div className="flex justify-center space-x-6 flex-wrap gap-4">
            <Badge variant="outline" className="px-4 py-2 text-lg border-2 hover:bg-blue-50 transition-colors">
              <Smartphone className="w-4 h-4 mr-2" />
              Electronics
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg border-2 hover:bg-green-50 transition-colors">
              <Home className="w-4 h-4 mr-2" />
              Home & Garden
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg border-2 hover:bg-purple-50 transition-colors">
              <Car className="w-4 h-4 mr-2" />
              Automotive
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg border-2 hover:bg-orange-50 transition-colors">
              <Users className="w-4 h-4 mr-2" />
              Baby & Kids
            </Badge>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center space-x-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-lg text-gray-600 mb-2">Trusted by thousands of families</p>
          <p className="text-sm text-gray-500">"Finally, peace of mind when it comes to product safety!" - Sarah M.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">RapidRecalls</span>
            </div>
            <p className="text-gray-600">© 2024 RapidRecalls. Keeping families safe, one product at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
