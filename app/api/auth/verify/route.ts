import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.redirect(new URL("/?error=invalid-token", request.url))
    }

    console.log("🔍 Verifying token:", token)

    // Find the magic link token
    const magicLinks = await sql`
      SELECT * FROM magic_links 
      WHERE token = ${token} 
      AND expires_at > NOW() 
      AND used = false
    `

    if (magicLinks.length === 0) {
      console.log("❌ Invalid or expired token")
      return NextResponse.redirect(new URL("/?error=invalid-token", request.url))
    }

    const magicLink = magicLinks[0]
    console.log("✅ Valid magic link found for email:", magicLink.email)

    // Find or create user
    const users = await sql`
      SELECT * FROM users WHERE email = ${magicLink.email}
    `

    let user
    if (users.length === 0) {
      console.log("👤 Creating new user for:", magicLink.email)
      const newUsers = await sql`
        INSERT INTO users (email, created_at, updated_at)
        VALUES (${magicLink.email}, NOW(), NOW())
        RETURNING *
      `
      user = newUsers[0]
    } else {
      user = users[0]
      console.log("👤 Existing user found:", user.id)
    }

    // Mark magic link as used
    await sql`
      UPDATE magic_links 
      SET used = true, used_at = NOW() 
      WHERE token = ${token}
    `

    // Create session
    const sessionToken = crypto.randomUUID()
    await sql`
      INSERT INTO sessions (user_id, token, expires_at, created_at)
      VALUES (${user.id}, ${sessionToken}, NOW() + INTERVAL '30 days', NOW())
    `

    console.log("🎉 Session created successfully for user:", user.id)

    // Create response and set cookie
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
