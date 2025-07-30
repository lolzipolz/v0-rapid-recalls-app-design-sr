"use client"

import { useState } from "react"
import { Shield, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUser } from "@/components/user-provider"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useUser()

  const handleGetStarted = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) throw new Error("Failed to create user")

      const { user } = await response.json()
      setUser(user)
      onGetStarted()
    } catch (error) {
      console.error("Failed to get started:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4 pt-12">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">RapidRecalls</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Never miss a product recall again. Get instant alerts when your purchases are recalled by FDA, CPSC, or
              USDA.
            </p>
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email to get started"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-lg rounded-xl border-gray-200"
              onKeyPress={(e) => e.key === "Enter" && handleGetStarted()}
            />
          </div>

          <Button
            onClick={handleGetStarted}
            disabled={isLoading || !email}
            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg disabled:opacity-50"
          >
            {isLoading ? "Setting up your account..." : "Get Started"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features Preview */}
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-gray-700">How it works:</p>

          <div className="grid gap-3">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-sm font-bold text-green-600">
                  1
                </div>
                <p className="text-sm text-gray-700">Add your products by scanning barcodes or entering manually</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
                  2
                </div>
                <p className="text-sm text-gray-700">We monitor FDA, CPSC, and USDA for recalls daily</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold text-red-600">
                  3
                </div>
                <p className="text-sm text-gray-700">Get instant email alerts if your products are recalled</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-gray-500">Monitoring official recalls from FDA, CPSC, USDA & NHTSA</p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
