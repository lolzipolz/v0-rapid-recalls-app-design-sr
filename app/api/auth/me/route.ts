import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Find valid session
    const sessions = await sql`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} 
      AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const session = sessions[0]

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        created_at: session.created_at,
      },
    })
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
