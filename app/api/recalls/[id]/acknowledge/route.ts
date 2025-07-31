import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await sql`
      UPDATE matched_recalls 
      SET acknowledged_at = NOW() 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Recall acknowledged" })
  } catch (error) {
    console.error("Failed to acknowledge recall:", error)
    return NextResponse.json({ error: "Failed to acknowledge recall" }, { status: 500 })
  }
}
