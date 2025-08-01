"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      switch (error) {
        case "invalid-link":
          setMessage("Invalid verification link")
          break
        case "expired-link":
          setMessage("This link has expired. Please request a new one.")
          break
        case "verification-failed":
          setMessage("Verification failed. Please try again.")
          break
        default:
          setMessage("Something went wrong. Please try again.")
      }
      return
    }

    if (!token) {
      setStatus("error")
      setMessage("No verification token found")
      return
    }

    // If we have a token and no error, verification is in progress
    // The server will handle the redirect to dashboard
    setTimeout(() => {
      setStatus("success")
      setMessage("Verification successful! Redirecting...")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    }, 2000)
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <h2 className="text-xl font-semibold">Verifying your login...</h2>
                <p className="text-gray-600">Please wait while we log you in.</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <h2 className="text-xl font-semibold text-green-800">Success!</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                <h2 className="text-xl font-semibold text-red-800">Verification Failed</h2>
                <p className="text-gray-600">{message}</p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
