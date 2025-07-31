import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await sql`
      UPDATE matched_recalls 
      SET resolved_at = NOW() 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Recall resolved" })
  } catch (error) {
    console.error("Failed to resolve recall:", error)
    return NextResponse.json({ error: "Failed to resolve recall" }, { status: 500 })
  }
}
