import { type NextRequest, NextResponse } from "next/server"
import { sql, getCurrentUser, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getCurrentUser(sessionToken)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get matched recalls for this user
    const recalls = await sql`
      SELECT 
        mr.*,
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
      WHERE mr.user_id = ${user.id}
      ORDER BY r.recall_date DESC, mr.created_at DESC
    `

    return NextResponse.json({ recalls })
  } catch (error) {
    console.error("Get recalls error:", error)
    return NextResponse.json({ error: "Failed to fetch recalls" }, { status: 500 })
  }
}
