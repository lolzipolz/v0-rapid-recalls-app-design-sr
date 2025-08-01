"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  notification_preferences: any
  created_at: string
  last_login: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include", // This ensures cookies are sent with the request
      })
      const data = await response.json()

      if (data.user) {
        setUser(data.user)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard</h2>
              <p className="text-gray-600">Please wait while we load your account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  return <Dashboard user={user} />
}
