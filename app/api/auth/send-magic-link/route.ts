import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import crypto from "crypto"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    console.log("🔄 Processing magic link request...")

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate magic link token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    console.log(`🔑 Generated token: ${token.substring(0, 8)}...`)

    // Check if user exists, if not create them
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length === 0) {
      // Create new user
      await sql`
        INSERT INTO users (email, magic_link_token, magic_link_expires)
        VALUES (${email}, ${token}, ${expires})
      `
    } else {
      // Update existing user
      await sql`
        UPDATE users 
        SET magic_link_token = ${token}, magic_link_expires = ${expires}, updated_at = NOW()
        WHERE email = ${email}
      `
    }

    // Create magic link URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`

    console.log(`🔗 Magic link generated for ${email}: ${magicLink}`)

    // In development, return the magic link for easy testing
    const isDevelopment = process.env.NODE_ENV === "development"

    if (isDevelopment) {
      console.log(`🔗 Magic link for ${email}: ${magicLink}`)
      return NextResponse.json({
        message: "Magic link sent! Check your email or use the link below.",
        magicLink: magicLink,
      })
    }

    // In production, send email
    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: "🔐 Your RapidRecalls Login Link",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login to RapidRecalls</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">🛡️ RapidRecalls</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Product Safety Alerts</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Welcome back!</h2>
              <p style="color: #475569; margin-bottom: 25px;">Click the button below to securely log in to your RapidRecalls account. This link will expire in 15 minutes.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  🔐 Log In to RapidRecalls
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${magicLink}" style="color: #2563eb; word-break: break-all;">${magicLink}</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This email was sent to ${email}. If you didn't request this login link, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
          Welcome to RapidRecalls!
          
          Click this link to log in to your account:
          ${magicLink}
          
          This link will expire in 15 minutes.
          
          If you didn't request this login link, you can safely ignore this email.
        `,
      }

      try {
        await sgMail.send(msg)
        console.log(`✅ Magic link email sent to: ${email}`)

        return NextResponse.json({
          success: true,
          message: "Magic link sent! Check your email.",
        })
      } catch (emailError) {
        console.error("❌ SendGrid error:", emailError)

        // Fallback: log the magic link
        console.log(`
        📧 EMAIL FAILED - MAGIC LINK FOR ${email}:
        ${magicLink}
        `)

        return NextResponse.json({
          success: true,
          message: "Magic link generated! Check server logs for the link.",
          ...(process.env.NODE_ENV === "development" && { magicLink }),
        })
      }
    }

    // Always log the magic link for debugging
    console.log(`🔗 Magic link generated for ${email}: ${magicLink}`)

    return NextResponse.json({
      message: "Magic link sent! Check your email to sign in.",
      ...(isDevelopment && { magicLink }),
    })
  } catch (error) {
    console.error("Failed to send magic link:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
