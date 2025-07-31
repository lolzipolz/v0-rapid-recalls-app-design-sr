import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Processing magic link request...")

    // Initialize database first
    await initializeDatabase()

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    console.log(`📧 Processing magic link for: ${email}`)

    // Generate magic link token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Check if user exists, create if not
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email}
    `

    if (existingUsers.length === 0) {
      console.log("👤 Creating new user...")
      await sql`
        INSERT INTO users (email, magic_link_token, magic_link_expires)
        VALUES (${email}, ${token}, ${expires})
      `
    } else {
      console.log("👤 Updating existing user...")
      await sql`
        UPDATE users 
        SET magic_link_token = ${token}, magic_link_expires = ${expires}
        WHERE email = ${email}
      `
    }

    // Send magic link email
    if (!process.env.SENDGRID_API_KEY) {
      console.log("⚠️ SendGrid not configured, magic link would be sent")
      return NextResponse.json({
        success: true,
        message: "Magic link sent! (SendGrid not configured in development)",
        debugToken: token, // Only for development
      })
    }

    const magicLink = `${process.env.VERCEL_URL || "http://localhost:3000"}/auth/verify?token=${token}`
    const fromEmail = process.env.FROM_EMAIL || "noreply@rapidrecalls.com"

    const msg = {
      to: email,
      from: fromEmail,
      subject: "Your RapidRecalls Magic Link",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to RapidRecalls!</h2>
          <p>Click the link below to sign in to your account:</p>
          <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Sign In to RapidRecalls
          </a>
          <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }

    console.log("📤 Sending email via SendGrid...")
    await sgMail.send(msg)
    console.log("✅ Magic link sent successfully")

    return NextResponse.json({
      success: true,
      message: "Magic link sent! Check your email.",
    })
  } catch (error) {
    console.error("❌ Magic link error:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
      }
      if (error.message.includes("SendGrid") || error.message.includes("email")) {
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
