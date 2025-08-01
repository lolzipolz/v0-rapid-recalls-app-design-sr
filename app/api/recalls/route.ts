import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
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

    // Get user's matched recalls with product information
    const recalls = await sql`
      SELECT 
        mr.id,
        mr.match_type,
        mr.confidence_score,
        mr.acknowledged_at,
        mr.resolved_at,
        mr.created_at,
        r.title,
        r.description,
        r.agency,
        r.severity,
        r.recall_date,
        r.link,
        p.name as product_name
      FROM matched_recalls mr
      JOIN recalls r ON mr.recall_id = r.id
      JOIN products p ON mr.product_id = p.id
      WHERE mr.user_id = ${userId}
      ORDER BY mr.created_at DESC
    `

    return NextResponse.json({ recalls })
  } catch (error) {
    console.error("Failed to get recalls:", error)
    return NextResponse.json({ error: "Failed to get recalls" }, { status: 500 })
  }
}
