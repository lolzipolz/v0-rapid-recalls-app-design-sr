import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get matched recalls for the user
    const recalls = await sql`
      SELECT 
        mr.*,
        p.name as product_name,
        p.brand as product_brand,
        r.title as recall_title,
        r.agency,
        r.severity,
        r.description,
        r.recall_date,
        r.link
      FROM matched_recalls mr
      JOIN products p ON mr.product_id = p.id
      JOIN recalls r ON mr.recall_id = r.id
      WHERE mr.user_id = ${userId}
      ORDER BY r.severity DESC, mr.confidence_score DESC, mr.created_at DESC
    `

    return NextResponse.json({ recalls })
  } catch (error) {
    console.error("Failed to fetch recalls:", error)
    return NextResponse.json({ error: "Failed to fetch recalls" }, { status: 500 })
  }
}
