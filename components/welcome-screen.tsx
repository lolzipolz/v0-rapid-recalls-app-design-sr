"use client"

import type React from "react"

import { useState } from "react"
import { Shield, ArrowRight, CheckCircle, Bell, Zap, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/components/user-provider"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const { signUp } = useUser()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: "Government Data",
      description: "Real-time monitoring of FDA, CPSC, USDA & NHTSA recalls",
    },
    {
      icon: <Bell className="w-6 h-6 text-green-600" />,
      title: "Instant Alerts",
      description: "Get notified immediately when your products are recalled",
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-600" />,
      title: "Smart Matching",
      description: "Advanced AI matches your products to official recall notices",
    },
  ]

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const testDatabase = async () => {
    try {
      const response = await fetch("/api/debug/database")
      const data = await response.json()
      setDebugInfo(JSON.stringify(data, null, 2))
    } catch (error) {
      setDebugInfo(`Debug test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleSignUp = async () => {
    setError(null)
    setDebugInfo(null)

    // Validation
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      await signUp(email.trim())
      onGetStarted()
    } catch (error) {
      console.error("Sign up failed:", error)

      let errorMessage = "Failed to create account. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("temporarily unavailable")) {
          errorMessage =
            "Service temporarily unavailable. Our database might be starting up. Please try again in a moment."
        } else if (error.message.includes("connection")) {
          errorMessage = "Connection issue. Please check your internet and try again."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSignUp()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="px-4 pt-12 pb-8">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">RapidRecalls</h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-sm mx-auto">
              Never miss a product recall again. Stay safe with instant alerts.
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-xs text-gray-500">Gov Agencies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-xs text-gray-500">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">AI</div>
              <div className="text-xs text-gray-500">Powered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-8 space-y-4">
        {features.map((feature, index) => (
          <Card key={index} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sign Up */}
      <div className="px-4 py-8">
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Get Started Free</h2>
              <p className="text-gray-600">Join thousands protecting their families</p>
            </div>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    {error.includes("temporarily unavailable") && (
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={testDatabase} className="text-xs bg-transparent">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Test Connection
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo && (
                <Alert>
                  <AlertDescription>
                    <details>
                      <summary className="cursor-pointer font-medium">Debug Information</summary>
                      <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">{debugInfo}</pre>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-14 rounded-xl border-gray-200 text-lg"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <Button
                onClick={handleSignUp}
                disabled={isLoading || !email.trim()}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-lg font-semibold shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating your account...
                  </div>
                ) : (
                  <>
                    Start Monitoring
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Free forever • No credit card required • Unsubscribe anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <div className="px-4 pb-8">
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-gray-700">Trusted by families nationwide</p>
          <div className="flex justify-center items-center gap-6 opacity-60">
            <div className="text-xs font-semibold text-gray-500">FDA</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-xs font-semibold text-gray-500">CPSC</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-xs font-semibold text-gray-500">USDA</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-xs font-semibold text-gray-500">NHTSA</div>
          </div>
        </div>
      </div>
    </div>
  )
}
