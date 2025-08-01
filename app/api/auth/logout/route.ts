import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session_token")?.value

    if (sessionToken) {
      // Clear session from database
      await sql`
        UPDATE users 
        SET session_token = NULL, session_expires = NULL 
        WHERE session_token = ${sessionToken}
      `
    }

    // Create response and clear session cookie
    const response = NextResponse.json({ message: "Logged out successfully" })

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout failed:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
