import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Find user with valid session
    const users = await sql`
      SELECT id, email, notification_preferences, created_at, last_login
      FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = users[0]

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
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
