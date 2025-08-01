"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Bell, Zap, CheckCircle, Mail, Star, Users, Package, Globe } from "lucide-react"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    setMessage("")
    setMessageType("")

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
        setMessage("Magic link sent! Check your email to sign in.")
        setMessageType("success")
        setEmail("")
      } else {
        setMessage(data.error || "Failed to send magic link")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">RapidRecalls</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 hidden sm:flex">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                4.9/5 Rating
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                🚀 Protecting 50,000+ families nationwide
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Never Miss a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                Product Recall
              </span>
              <br />
              Again
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get instant alerts when your products are recalled. Our AI monitors thousands of sources 24/7 to keep your
              family safe from dangerous products.
            </p>

            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-12 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>
                  <strong>50K+</strong> Protected Families
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-600" />
                <span>
                  <strong>2M+</strong> Products Monitored
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-red-600" />
                <span>
                  <strong>15K+</strong> Alerts Sent
                </span>
              </div>
            </div>

            {/* Email Signup */}
            <Card className="max-w-md mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Start Protecting Your Family</CardTitle>
                <CardDescription className="text-gray-600">
                  Enter your email to get started - it's completely free
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-blue-500"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Magic Link...
                      </div>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Get Instant Access
                      </>
                    )}
                  </Button>
                </form>

                {message && (
                  <Alert
                    className={`mt-4 ${messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
                  >
                    <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  No spam, ever. Unsubscribe anytime. We respect your privacy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How RapidRecalls Keeps You Safe</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI system monitors recalls from FDA, CPSC, NHTSA, and hundreds of other sources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-4">Add Your Products</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Simply add products you own - from cars to baby food. Our smart matching finds them across all recall
                databases.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-2 border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-4">24/7 Monitoring</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Our AI scans thousands of government and manufacturer sources every hour for new recalls affecting your
                products.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-2 border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl mb-4">Instant Alerts</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Get immediate notifications via email when any of your products are recalled, with clear next steps to
                stay safe.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">We Monitor Everything You Own</h2>
            <p className="text-xl text-gray-600">From everyday items to major purchases - we've got you covered</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Vehicles", icon: "🚗", count: "2.3M+" },
              { name: "Electronics", icon: "📱", count: "890K+" },
              { name: "Food & Drinks", icon: "🥛", count: "1.2M+" },
              { name: "Baby Products", icon: "🍼", count: "450K+" },
              { name: "Home & Garden", icon: "🏠", count: "670K+" },
              { name: "Health & Beauty", icon: "💊", count: "320K+" },
              { name: "Toys & Games", icon: "🧸", count: "280K+" },
              { name: "Sports & Outdoors", icon: "⚽", count: "190K+" },
              { name: "Pet Supplies", icon: "🐕", count: "150K+" },
              { name: "Clothing", icon: "👕", count: "95K+" },
              { name: "Tools", icon: "🔧", count: "120K+" },
              { name: "Appliances", icon: "🔌", count: "85K+" },
            ].map((category) => (
              <Card key={category.name} className="p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.count} monitored</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-900">4.9/5</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Trusted by Families Nationwide</h2>
            <p className="text-xl text-gray-600">Join thousands of families who trust RapidRecalls to keep them safe</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "RapidRecalls saved my family from a dangerous car seat recall. Got the alert within hours of the
                announcement!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">SM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-500">Mother of 2, California</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "As a busy parent, I can't keep track of every recall. RapidRecalls does it for me automatically."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">MJ</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Mike J.</p>
                  <p className="text-sm text-gray-500">Father of 3, Texas</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The interface is so simple, and the alerts are clear and actionable. Exactly what I needed."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">LK</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lisa K.</p>
                  <p className="text-sm text-gray-500">Grandmother, Florida</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Protect Your Family?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 50,000+ families who trust RapidRecalls to keep them safe from dangerous products.
          </p>

          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-lg"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Start Free Monitoring"}
                </Button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-4">Free forever. No credit card required.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">RapidRecalls</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2024 RapidRecalls. All rights reserved.</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>SOC 2 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
