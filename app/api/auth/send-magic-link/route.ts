import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Processing magic link request...")

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`📧 Processing request for: ${normalizedEmail}`)

    // Generate magic link token
    const magicToken = crypto.randomUUID()
    const magicExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    console.log(`🔑 Generated token: ${magicToken.substring(0, 8)}...`)

    // Check if user exists, if not create them
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail}
    `

    let userId
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
      // Update existing user with magic link token
      await sql`
        UPDATE users 
        SET magic_link_token = ${magicToken}, 
            magic_link_expires = ${magicExpires},
            updated_at = NOW()
        WHERE email = ${normalizedEmail}
      `
      console.log("✅ Updated existing user with magic link")
    } else {
      // Create new user
      const newUsers = await sql`
        INSERT INTO users (email, magic_link_token, magic_link_expires)
        VALUES (${normalizedEmail}, ${magicToken}, ${magicExpires})
        RETURNING id
      `
      userId = newUsers[0].id
      console.log("✅ Created new user with magic link")
    }

    // Create magic link URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin)
    const magicLink = `${baseUrl}/api/auth/verify?token=${magicToken}`

    console.log(`🔗 Magic link created: ${magicLink}`)

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
      console.warn("⚠️ SendGrid not configured, logging magic link instead")
      console.log(`
      📧 MAGIC LINK FOR ${normalizedEmail}:
      ${magicLink}
      
      This link expires in 15 minutes.
      `)

      return NextResponse.json({
        success: true,
        message: "Magic link generated! Check server logs for the link.",
        // Include link in development for testing
        ...(process.env.NODE_ENV === "development" && { magicLink }),
      })
    }

    // Send email via SendGrid
    const msg = {
      to: normalizedEmail,
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
              This email was sent to ${normalizedEmail}. If you didn't request this login link, you can safely ignore this email.
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
      console.log(`✅ Magic link email sent to: ${normalizedEmail}`)

      return NextResponse.json({
        success: true,
        message: "Magic link sent! Check your email.",
      })
    } catch (emailError) {
      console.error("❌ SendGrid error:", emailError)

      // Fallback: log the magic link
      console.log(`
      📧 EMAIL FAILED - MAGIC LINK FOR ${normalizedEmail}:
      ${magicLink}
      `)

      return NextResponse.json({
        success: true,
        message: "Magic link generated! Check server logs for the link.",
        ...(process.env.NODE_ENV === "development" && { magicLink }),
      })
    }
  } catch (error) {
    console.error("❌ Send magic link error:", error)
    return NextResponse.json(
      {
        error: "Failed to send magic link",
      },
      { status: 500 },
    )
  }
}
