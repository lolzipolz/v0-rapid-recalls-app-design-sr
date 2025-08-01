"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard"
import WelcomeScreen from "@/components/welcome-screen"

interface User {
  id: string
  email: string
  notification_preferences: any
  created_at: string
  last_login: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProducts, setHasProducts] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)

        // Check if user has products
        const productsResponse = await fetch("/api/products", {
          credentials: "include",
        })

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setHasProducts(productsData.products && productsData.products.length > 0)
        }
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return hasProducts ? (
    <Dashboard user={user} />
  ) : (
    <WelcomeScreen user={user} onProductAdded={() => setHasProducts(true)} />
  )
}
