import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const users = await sql`
      SELECT id FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = users[0].id
    const recallId = params.id

    // Update the matched recall to mark as resolved
    await sql`
      UPDATE matched_recalls 
      SET resolved_at = NOW(), acknowledged_at = COALESCE(acknowledged_at, NOW())
      WHERE id = ${recallId} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to resolve recall:", error)
    return NextResponse.json({ error: "Failed to resolve recall" }, { status: 500 })
  }
}
