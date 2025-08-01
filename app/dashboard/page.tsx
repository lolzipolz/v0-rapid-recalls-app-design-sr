"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard"
import WelcomeScreen from "@/components/welcome-screen"

interface User {
  id: string
  email: string
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasProducts, setHasProducts] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/")
          return
        }

        const userData = await response.json()
        setUser(userData)

        // Check if user has products
        const productsResponse = await fetch("/api/products", {
          credentials: "include",
        })

        if (productsResponse.ok) {
          const products = await productsResponse.json()
          setHasProducts(products.length > 0)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return hasProducts ? <Dashboard user={user} /> : <WelcomeScreen user={user} />
}
