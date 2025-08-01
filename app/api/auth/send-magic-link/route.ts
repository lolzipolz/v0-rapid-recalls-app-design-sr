import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    console.log("📧 Sending magic link to:", email)

    // Generate magic link token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store magic link
    await sql`
      INSERT INTO magic_links (email, token, expires_at, created_at)
      VALUES (${email}, ${token}, ${expiresAt}, NOW())
    `

    // Create magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    console.log("🔗 Magic link generated:", magicLink)

    // Try to send email with SendGrid
    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      try {
        const sgMail = require("@sendgrid/mail")
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)

        const msg = {
          to: email,
          from: process.env.FROM_EMAIL,
          subject: "Your RapidRecalls Login Link",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to RapidRecalls</h2>
              <p>Click the link below to sign in to your account:</p>
              <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Sign In to RapidRecalls
              </a>
              <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        }

        await sgMail.send(msg)
        console.log("✅ Email sent successfully via SendGrid")
      } catch (emailError) {
        console.error("❌ SendGrid error:", emailError)
        console.log("📧 Fallback: Magic link ->", magicLink)
      }
    } else {
      console.log("📧 SendGrid not configured. Magic link:", magicLink)
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent! Check your email.",
    })
  } catch (error) {
    console.error("❌ Send magic link error:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
