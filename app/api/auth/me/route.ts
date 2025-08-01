import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await getCurrentUser(sessionToken)

    if (!user) {
      // Clear invalid session cookie
      const response = NextResponse.json({ user: null }, { status: 200 })
      response.cookies.delete("session_token")
      return response
    }

    // Return user data (excluding sensitive fields)
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
    console.error("Failed to get current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
