"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address" })
      return
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to RapidRecalls</h1>
            <p className="text-gray-600">Stay safe with instant product recall alerts</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Real-time government recall monitoring</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Smart product matching with photos</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Instant email alerts for your products</span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Magic Link...
                </>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>

          {/* Message */}
          {message && (
            <Alert
              className={`mt-4 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to receive product safety alerts via email. No spam, unsubscribe anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
