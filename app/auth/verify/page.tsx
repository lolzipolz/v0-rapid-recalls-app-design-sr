"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    // The verification happens on the server via the GET route
    // This page is just for showing the loading state
    // The actual redirect happens in the API route

    const timer = setTimeout(() => {
      setStatus("error")
      setMessage("Verification taking longer than expected")
    }, 5000)

    return () => clearTimeout(timer)
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Verifying your login...</h1>
              <p className="text-gray-600">Please wait while we sign you in.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Success!</h1>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-medium">
                Return to homepage
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
