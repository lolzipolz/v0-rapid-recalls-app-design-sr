"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function WelcomeScreen() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address" })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Magic link sent! Check your email to log in.",
        })

        // In development, show the magic link
        if (data.magicLink && process.env.NODE_ENV === "development") {
          console.log("🔗 Magic link (dev only):", data.magicLink)
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send magic link. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to send magic link:", error)
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">RapidRecalls</h1>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Never Miss a Product Recall Again</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get instant alerts when your products are recalled by FDA, CPSC, USDA, or NHTSA. Stay safe with real-time
            monitoring of government recall databases.
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Government Sources</h3>
            <p className="text-gray-600">
              Monitor FDA, CPSC, USDA, and NHTSA recall databases 24/7 for the latest safety alerts.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Alerts</h3>
            <p className="text-gray-600">Get email notifications the moment any of your products are recalled.</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Setup</h3>
            <p className="text-gray-600">
              Add products by scanning barcodes, uploading receipts, or importing from Amazon.
            </p>
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Get Started Free</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your email to receive a secure login link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-500 pt-4">
                <p>
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by families nationwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-xs font-medium text-gray-400">FDA MONITORED</div>
            <div className="text-xs font-medium text-gray-400">CPSC ALERTS</div>
            <div className="text-xs font-medium text-gray-400">USDA TRACKING</div>
            <div className="text-xs font-medium text-gray-400">NHTSA UPDATES</div>
          </div>
        </div>
      </div>
    </div>
  )
}
