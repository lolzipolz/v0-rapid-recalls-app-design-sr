"use client"

import { useUser } from "@/components/user-provider"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Dashboard } from "@/components/dashboard"
import { useState } from "react"

export default function Home() {
  const { user, isLoading } = useUser()
  const [showDashboard, setShowDashboard] = useState(false)

  // Show loading state while checking for existing user
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user exists or they just signed up, show dashboard
  if (user || showDashboard) {
    return <Dashboard />
  }

  // Otherwise show welcome screen
  return <WelcomeScreen onGetStarted={() => setShowDashboard(true)} />
}
