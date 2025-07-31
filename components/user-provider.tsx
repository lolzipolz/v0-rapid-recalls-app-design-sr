"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  email_verified: boolean
  notification_preferences: {
    email: boolean
    push: boolean
  }
  created_at: string
  updated_at: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  signUp: (email: string) => Promise<void>
  signOut: () => void
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem("rapidrecalls_user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem("rapidrecalls_user")
      }
    }
    setIsLoading(false)
  }, [])

  const signUp = async (email: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create account")
      }

      const { user: newUser } = await response.json()
      setUser(newUser)
      localStorage.setItem("rapidrecalls_user", JSON.stringify(newUser))

      console.log("✅ User created successfully:", newUser.email)
    } catch (error) {
      console.error("❌ Sign up failed:", error)
      throw error
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("rapidrecalls_user")
    console.log("👋 User signed out")
  }

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      localStorage.setItem("rapidrecalls_user", JSON.stringify(newUser))
    } else {
      localStorage.removeItem("rapidrecalls_user")
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: updateUser,
        signUp,
        signOut,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
