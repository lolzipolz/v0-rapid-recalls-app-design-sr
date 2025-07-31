"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      setStatus("error")
      setMessage("Invalid verification link")
      return
    }

    // The verification happens on the server via GET request
    // This component just shows the loading state
    const timer = setTimeout(() => {
      // If we're still here after 3 seconds, something went wrong
      setStatus("error")
      setMessage("Verification taking too long. Please try again.")
    }, 3000)

    return () => clearTimeout(timer)
  }, [searchParams])

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Verifying your login...</h1>
            </div>
            <p className="text-gray-600">Please wait while we securely log you in.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-gray-600 mb-6">You've been successfully logged in.</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
