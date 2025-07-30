import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Create or get existing user
    const result = await sql`
      INSERT INTO users (email)
      VALUES (${email})
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
