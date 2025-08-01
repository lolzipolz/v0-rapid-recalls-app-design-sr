import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomUUID()
    const magicLinkExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      // Update existing user
      await sql`
        UPDATE users 
        SET 
          magic_link_token = ${magicLinkToken},
          magic_link_expires = ${magicLinkExpires},
          updated_at = NOW()
        WHERE email = ${email}
      `
    } else {
      // Create new user
      await sql`
        INSERT INTO users (email, magic_link_token, magic_link_expires)
        VALUES (${email}, ${magicLinkToken}, ${magicLinkExpires})
      `
    }

    // In production, you would send an actual email here
    // For now, we'll just log the magic link
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify?token=${magicLinkToken}`

    console.log("🔗 Magic Link for", email, ":", magicLink)

    // Simulate email sending
    if (process.env.NODE_ENV === "development") {
      console.log(`
      📧 EMAIL SIMULATION
      To: ${email}
      Subject: Sign in to RapidRecalls
      
      Click here to sign in: ${magicLink}
      
      This link expires in 15 minutes.
      `)
    }

    return NextResponse.json({
      message: "Magic link sent successfully",
      // In development, include the link for testing
      ...(process.env.NODE_ENV === "development" && { magicLink }),
    })
  } catch (error) {
    console.error("Send magic link error:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
