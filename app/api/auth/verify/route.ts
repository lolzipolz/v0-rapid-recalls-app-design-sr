import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.redirect(new URL("/?error=invalid-link", request.url))
    }

    // Find user with valid magic link token
    const users = await sql`
      SELECT * FROM users 
      WHERE email = ${email.toLowerCase().trim()}
      AND magic_link_token = ${token}
      AND magic_link_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.redirect(new URL("/?error=expired-link", request.url))
    }

    const user = users[0]

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

    // Set secure session cookie
    const cookieStore = cookies()
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpires,
      path: "/",
    })

    console.log(`✅ User ${email} logged in successfully`)

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error) {
    console.error("Failed to verify magic link:", error)
    return NextResponse.redirect(new URL("/?error=verification-failed", request.url))
  }
}
