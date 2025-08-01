import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (sessionToken) {
      // Clear session from database
      await sql`
        UPDATE users 
        SET session_token = NULL, session_expires = NULL, updated_at = NOW()
        WHERE session_token = ${sessionToken}
      `
    }

    // Create response and clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
