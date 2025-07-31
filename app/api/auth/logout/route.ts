import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      // Clear session from database
      await sql`
        UPDATE users 
        SET session_token = NULL, session_expires = NULL
        WHERE session_token = ${sessionToken}
      `
    }

    // Clear session cookie
    cookieStore.delete("session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
