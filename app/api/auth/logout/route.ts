import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (sessionToken) {
      // Delete session from database
      await sql`
        DELETE FROM sessions WHERE token = ${sessionToken}
      `
    }

    // Create response and clear cookie
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
    console.error("❌ Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
