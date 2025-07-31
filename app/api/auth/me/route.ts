import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user from session
    const users = await sql`
      SELECT id, email, notification_preferences, created_at, last_login
      FROM users 
      WHERE session_token = ${sessionToken}
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Failed to get current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
