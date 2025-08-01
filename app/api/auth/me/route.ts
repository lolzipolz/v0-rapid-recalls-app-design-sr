import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Checking authentication...")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log(`🔍 Session token: ${sessionToken ? sessionToken.substring(0, 8) + "..." : "none"}`)

    if (!sessionToken) {
      console.log("❌ No session token found")
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await getCurrentUser(sessionToken)

    if (!user) {
      console.log("❌ Invalid or expired session")
      return NextResponse.json({ user: null }, { status: 401 })
    }

    console.log(`✅ User authenticated: ${user.email}`)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        notification_preferences: user.notification_preferences,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    })
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
