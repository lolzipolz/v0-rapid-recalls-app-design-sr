"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for error parameters from auth redirects
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "invalid-link":
          setError("Invalid login link. Please request a new one.")
          break
        case "expired-link":
          setError("Login link has expired. Please request a new one.")
          break
        case "verification-failed":
          setError("Login verification failed. Please try again.")
          break
        default:
          setError("An error occurred during login. Please try again.")
      }
    }

    // Check if user is already authenticated
    checkAuth()
  }, [router, searchParams])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include", // This ensures cookies are sent with the request
      })
      const data = await response.json()

      if (data.user) {
        // User is authenticated, redirect to dashboard
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <WelcomeScreen />
    </div>
  )
}
