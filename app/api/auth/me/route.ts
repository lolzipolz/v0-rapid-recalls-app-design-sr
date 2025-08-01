import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const users = await sql`
      SELECT id, email, notification_preferences, created_at, last_login
      FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Failed to get current user:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
