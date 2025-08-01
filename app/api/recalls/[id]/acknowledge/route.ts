import { type NextRequest, NextResponse } from "next/server"
import { sql, getCurrentUser, initializeDatabase } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const recallId = params.id

    await sql`
      UPDATE matched_recalls 
      SET acknowledged_at = NOW()
      WHERE id = ${recallId} AND user_id = ${user.id}
    `

    return NextResponse.json({ message: "Recall acknowledged" })
  } catch (error) {
    console.error("Acknowledge recall error:", error)
    return NextResponse.json({ error: "Failed to acknowledge recall" }, { status: 500 })
  }
}
