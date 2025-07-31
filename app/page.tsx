"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for error parameters
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
          setError("An error occurred. Please try again.")
      }
    }

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          router.push("/dashboard")
          return
        }
      } catch (error) {
        console.log("Not authenticated, showing welcome screen")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <WelcomeScreen onGetStarted={() => router.push("/dashboard")} />
    </div>
  )
}
