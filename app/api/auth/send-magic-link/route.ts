import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import sgMail from "@sendgrid/mail"

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Generate magic link token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Create or update user with magic link token
    await sql`
      INSERT INTO users (email, magic_link_token, magic_link_expires)
      VALUES (${cleanEmail}, ${token}, ${expires})
      ON CONFLICT (email) 
      DO UPDATE SET 
        magic_link_token = ${token},
        magic_link_expires = ${expires},
        updated_at = NOW()
    `

    // Create magic link URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://rapidrecalls.vercel.app"

    const magicLink = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(cleanEmail)}`

    // Send email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const fromEmail = process.env.FROM_EMAIL || "noreply@rapidrecalls.com"

      const msg = {
        to: cleanEmail,
        from: fromEmail,
        subject: "🔐 Your RapidRecalls Login Link",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px;">🛡️</span>
              </div>
              <h1 style="color: #1f2937; margin: 0;">Welcome to RapidRecalls</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Your secure login link is ready</p>
            </div>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="color: #374151; margin: 0 0 15px 0;">Click the button below to securely log in to your RapidRecalls account:</p>
              <div style="text-align: center;">
                <a href="${magicLink}" style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                  🔐 Log In to RapidRecalls
                </a>
              </div>
            </div>
            
            <div style="border-left: 4px solid #fbbf24; background: #fffbeb; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏰ This link expires in 15 minutes</strong> for your security.
              </p>
            </div>
            
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              <p>If you didn't request this login link, you can safely ignore this email.</p>
              <p>Need help? Reply to this email or visit our support page.</p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>RapidRecalls - Keeping your family safe from product recalls</p>
              <p>Monitoring FDA, CPSC, USDA & NHTSA recalls 24/7</p>
            </div>
          </div>
        `,
        text: `
Welcome to RapidRecalls!

Click this link to log in securely: ${magicLink}

This link expires in 15 minutes for your security.

If you didn't request this login link, you can safely ignore this email.

RapidRecalls - Keeping your family safe from product recalls
        `,
      }

      await sgMail.send(msg)
      console.log(`✅ Magic link sent to ${cleanEmail}`)
    } else {
      console.log(`⚠️ SendGrid not configured, magic link: ${magicLink}`)
    }

    return NextResponse.json({
      message: "Magic link sent successfully",
      // Only include magic link in development
      ...(process.env.NODE_ENV === "development" && { magicLink }),
    })
  } catch (error) {
    console.error("Failed to send magic link:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
