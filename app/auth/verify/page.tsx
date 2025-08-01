"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    // The verification happens on the server via the GET route
    // If we reach this page, it means there was an issue
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      switch (error) {
        case "invalid-token":
          setMessage("Invalid or expired verification link")
          break
        case "verification-failed":
          setMessage("Verification failed. Please try again.")
          break
        default:
          setMessage("An error occurred during verification")
      }
    } else {
      // This shouldn't happen if verification was successful
      setStatus("error")
      setMessage("Verification incomplete")
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            {status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span>
              {status === "loading" && "Verifying..."}
              {status === "success" && "Verification Successful"}
              {status === "error" && "Verification Failed"}
            </span>
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we verify your account"}
            {status === "success" && "Redirecting you to your dashboard"}
            {status === "error" && "There was a problem with your verification link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{message}</AlertDescription>
            </Alert>
          )}

          {status === "loading" && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
