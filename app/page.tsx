"use client"

import { useState } from "react"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Dashboard } from "@/components/dashboard"
import { AddProduct } from "@/components/add-product"
import { UserProvider } from "@/components/user-provider"

export default function RapidRecallsApp() {
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "dashboard" | "add-product">("welcome")

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        {currentScreen === "welcome" && <WelcomeScreen onGetStarted={() => setCurrentScreen("dashboard")} />}
        {currentScreen === "dashboard" && <Dashboard onAddProduct={() => setCurrentScreen("add-product")} />}
        {currentScreen === "add-product" && <AddProduct onBack={() => setCurrentScreen("dashboard")} />}
      </div>
    </UserProvider>
  )
}
