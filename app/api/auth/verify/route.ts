import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/?error=invalid-token", request.url))
    }

    console.log(`🔍 Verifying token: ${token.substring(0, 8)}...`)

    // Find user with valid magic link token
    const users = await sql`
      SELECT id, email 
      FROM users 
      WHERE magic_link_token = ${token} 
      AND magic_link_expires > NOW()
    `

    if (users.length === 0) {
      console.log("❌ Invalid or expired token")
      return NextResponse.redirect(new URL("/?error=expired-token", request.url))
    }

    const user = users[0]
    console.log(`✅ Valid token for user: ${user.email}`)

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Update user with session and clear magic link
    await sql`
      UPDATE users 
      SET 
        session_token = ${sessionToken},
        session_expires = ${sessionExpires},
        magic_link_token = NULL,
        magic_link_expires = NULL,
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    console.log(`🎫 Session created for ${user.email}`)

    // Create response and set session cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url))

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Verification error:", error)
    return NextResponse.redirect(new URL("/?error=verification-failed", request.url))
  }
}
