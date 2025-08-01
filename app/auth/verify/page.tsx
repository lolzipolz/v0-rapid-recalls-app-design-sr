"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    // If no error, the verification was successful and user was redirected to dashboard
    // This page only shows if there was an error
  }, [])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "invalid-token":
        return "The magic link is invalid. Please request a new one."
      case "expired-token":
        return "The magic link has expired. Please request a new one."
      case "verification-failed":
        return "Verification failed. Please try again."
      default:
        return "An unknown error occurred. Please try again."
    }
  }

  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Verification Successful!</h2>
          <p className="text-gray-600">Redirecting you to the dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Verification Failed</h2>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>

        <Button onClick={() => router.push("/")} className="w-full">
          Return to Homepage
        </Button>
      </div>
    </div>
  )
}
