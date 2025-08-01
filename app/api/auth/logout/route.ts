import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Processing logout...")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      // Clear session from database
      await sql`
        UPDATE users 
        SET session_token = NULL, session_expires = NULL, updated_at = NOW()
        WHERE session_token = ${sessionToken}
      `
      console.log("✅ Session cleared from database")
    }

    // Create response and clear session cookie
    const response = NextResponse.json({ success: true })

    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0), // Expire immediately
      path: "/",
    })

    console.log("✅ User logged out successfully")

    return response
  } catch (error) {
    console.error("❌ Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
