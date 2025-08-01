"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Mail, Bell, Search } from "lucide-react"

export function WelcomeScreen() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include", // Include credentials for auth requests
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Magic link sent! Check your email to sign in.",
        })
        setEmail("")
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send magic link. Please try again.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">RapidRecalls</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Never miss a product recall again. Get instant notifications when your products are recalled, keeping you
            and your family safe.
          </p>

          {/* Email Signup Form */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Mail className="w-5 h-5 mr-2" />
                Get Started Free
              </CardTitle>
              <CardDescription>
                Enter your email to receive a magic link and start monitoring your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>

              {message && (
                <Alert
                  className={`mt-4 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
                >
                  <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
              <p className="text-gray-600">Get notified immediately when any of your products are recalled</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
              <p className="text-gray-600">AI-powered system matches recalls to your specific products</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Stay Protected</h3>
              <p className="text-gray-600">Monitor multiple government agencies and databases 24/7</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Families Everywhere</h2>
            <p className="text-gray-600">Join thousands of users who stay informed about product safety</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Products Monitored</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Recalls Detected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Add Your Products</h3>
              <p className="text-gray-600">Upload receipts, scan barcodes, or manually add products you own</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">We Monitor</h3>
              <p className="text-gray-600">Our system continuously checks for recalls across multiple agencies</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Notified</h3>
              <p className="text-gray-600">Receive instant alerts via email when your products are recalled</p>
            </div>
          </div>
        </div>

        {/* Recent Recalls Preview */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Recalls We've Detected</h2>
            <p className="text-gray-600">Stay informed about the latest product safety issues</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Baby Formula Recall - Contamination Risk</p>
                  <p className="text-sm text-gray-600">FDA • 2 days ago</p>
                </div>
              </div>
              <Badge variant="destructive">High</Badge>
            </div>

            <div className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Electric Kettle - Fire Hazard</p>
                  <p className="text-sm text-gray-600">CPSC • 1 week ago</p>
                </div>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>

            <div className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Dog Food - Salmonella Risk</p>
                  <p className="text-sm text-gray-600">FDA • 2 weeks ago</p>
                </div>
              </div>
              <Badge variant="outline">Low</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
