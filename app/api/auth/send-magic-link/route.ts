import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error("❌ SENDGRID_API_KEY not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Generate magic link token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Create or update user
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    let userId
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
      await sql`
        UPDATE users 
        SET magic_link_token = ${token}, magic_link_expires = ${expires}, updated_at = NOW()
        WHERE email = ${email.toLowerCase()}
      `
    } else {
      const newUsers = await sql`
        INSERT INTO users (email, magic_link_token, magic_link_expires)
        VALUES (${email.toLowerCase()}, ${token}, ${expires})
        RETURNING id
      `
      userId = newUsers[0].id
    }

    // Create magic link
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || "noreply@rapidrecalls.com",
      subject: "🔐 Your RapidRecalls Login Link",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RapidRecalls Login</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px;">🛡️</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Welcome to RapidRecalls</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Your secure login link is ready</h2>
            <p style="color: #6b7280; margin-bottom: 25px;">Click the button below to securely log in to your RapidRecalls account. This link will expire in 15 minutes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                🔐 Log In to RapidRecalls
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Stay safe with real-time product recall monitoring<br>
              <strong>FDA • CPSC • USDA • NHTSA</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              If you didn't request this login link, you can safely ignore this email.
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
        
        Stay safe with real-time product recall monitoring from FDA, CPSC, USDA, and NHTSA.
      `,
    }

    await sgMail.send(msg)

    console.log(`✅ Magic link sent to ${email}`)

    return NextResponse.json({
      success: true,
      message: "Magic link sent successfully",
      ...(process.env.NODE_ENV === "development" && { magicLink }),
    })
  } catch (error) {
    console.error("❌ Send magic link error:", error)

    if (error.response?.body?.errors) {
      console.error("SendGrid errors:", error.response.body.errors)
    }

    return NextResponse.json({ error: "Failed to send magic link. Please try again." }, { status: 500 })
  }
}
