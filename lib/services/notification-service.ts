import { sql } from "../database"

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendPendingNotifications(): Promise<NotificationResult> {
    const result: NotificationResult = {
      totalPending: 0,
      sent: 0,
      failed: 0,
      errors: [],
    }

    try {
      // Get unnotified matches for users who want email notifications
      const pendingMatches = await sql`
        SELECT 
          mr.*,
          u.email,
          u.notification_preferences,
          p.name as product_name,
          p.brand as product_brand,
          r.title as recall_title,
          r.agency,
          r.severity,
          r.description,
          r.link,
          r.recall_date
        FROM matched_recalls mr
        JOIN users u ON mr.user_id = u.id
        JOIN products p ON mr.product_id = p.id
        JOIN recalls r ON mr.recall_id = r.id
        WHERE mr.notified_at IS NULL
        AND u.notification_preferences->>'email' = 'true'
        ORDER BY r.severity DESC, mr.confidence_score DESC
      `

      result.totalPending = pendingMatches.length
      console.log(`📧 Found ${pendingMatches.length} pending notifications`)

      for (const match of pendingMatches) {
        try {
          await this.sendEmailNotification(match)
          result.sent++

          // Mark as notified
          await sql`
            UPDATE matched_recalls 
            SET notified_at = NOW() 
            WHERE id = ${match.id}
          `
        } catch (error) {
          result.failed++
          result.errors.push(
            `Failed to notify user ${match.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
          console.error(`Failed to send notification to ${match.email}:`, error)
        }
      }

      console.log(`✅ Notifications complete: ${result.sent} sent, ${result.failed} failed`)
      return result
    } catch (error) {
      console.error("Notification service failed:", error)
      throw error
    }
  }

  private async sendEmailNotification(match: any): Promise<void> {
    const emailContent = this.generateEmailContent(match)

    // Log notification attempt
    const logResult = await sql`
      INSERT INTO notification_log (user_id, matched_recall_id, type, status)
      VALUES (${match.user_id}, ${match.id}, 'email', 'pending')
      RETURNING id
    `
    const logId = logResult[0].id

    try {
      // Send email using SendGrid
      await this.sendEmail(match.email, emailContent)

      // Update log as sent
      await sql`
        UPDATE notification_log 
        SET status = 'sent', sent_at = NOW()
        WHERE id = ${logId}
      `

      console.log(`📧 Email sent to ${match.email} for ${match.product_name}`)
    } catch (error) {
      // Update log as failed
      await sql`
        UPDATE notification_log 
        SET status = 'failed', error_message = ${error instanceof Error ? error.message : "Unknown error"}
        WHERE id = ${logId}
      `
      throw error
    }
  }

  private generateEmailContent(match: any): EmailContent {
    const severityEmoji = {
      high: "🚨",
      medium: "⚠️",
      low: "📢",
    }

    const severityColor = {
      high: "#dc2626",
      medium: "#d97706",
      low: "#ea580c",
    }

    const subject = `${severityEmoji[match.severity]} URGENT: ${match.product_name} Recalled`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Recall Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <span style="font-size: 24px;">🛡️</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">RapidRecalls Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Product Safety Notification</p>
        </div>

        <!-- Alert Banner -->
        <div style="background: ${severityColor[match.severity]}15; border: 2px solid ${severityColor[match.severity]}40; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <span style="font-size: 24px;">${severityEmoji[match.severity]}</span>
            <div>
              <h2 style="margin: 0; color: ${severityColor[match.severity]}; font-size: 18px; font-weight: 700;">
                ${match.severity.toUpperCase()} PRIORITY RECALL
              </h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Issued by ${match.agency} • ${Math.round(match.confidence_score * 100)}% match confidence</p>
            </div>
          </div>
        </div>

        <!-- Product Info -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 600;">Your Product</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #374151;">${match.product_name}</p>
          ${match.product_brand ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Brand: ${match.product_brand}</p>` : ""}
        </div>

        <!-- Recall Details -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Recall Information</h3>
          <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 500;">${match.recall_title}</h4>
          ${match.description ? `<p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${match.description}</p>` : ""}
          <div style="display: flex; gap: 20px; font-size: 14px; color: #6b7280;">
            <span><strong>Agency:</strong> ${match.agency}</span>
            <span><strong>Date:</strong> ${new Date(match.recall_date).toLocaleDateString()}</span>
          </div>
        </div>

        <!-- Action Button -->
        ${
          match.link
            ? `
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${match.link}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Official Recall Notice →
          </a>
        </div>
        `
            : ""
        }

        <!-- What to Do -->
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px; font-weight: 600;">⚡ What You Should Do</h3>
          <ul style="margin: 0; padding-left: 20px; color: #92400e;">
            <li style="margin-bottom: 5px;">Stop using this product immediately</li>
            <li style="margin-bottom: 5px;">Check the official recall notice for specific instructions</li>
            <li style="margin-bottom: 5px;">Contact the manufacturer for refund/replacement options</li>
            <li>Keep your receipt and product information</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">This alert was generated by <strong>RapidRecalls</strong></p>
          <p style="margin: 0 0 10px 0;">We monitor official government recall databases to keep you safe</p>
          <p style="margin: 0; font-size: 12px;">If this product doesn't belong to you, you can mark it as resolved in your dashboard</p>
        </div>

      </body>
      </html>
    `

    return { subject, html }
  }

  private async sendEmail(to: string, content: EmailContent): Promise<void> {
    // SendGrid implementation
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: to }],
                subject: content.subject,
              },
            ],
            from: {
              email: 'alerts@rapidrecalls.com',
              name: 'RapidRecalls'
            },
            content: [
              {
                type: 'text/html',
                value: content.html,
              },
            ],
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`SendGrid error: ${response.status} - ${error}`)
        }

        console.log(`✅ Email sent successfully to ${to}`)
      } catch (error) {
        console.error('SendGrid email failed:', error)
        throw error
      }
    } else {
      // Development fallback
      console.log(`📧 [DEV MODE] Email would be sent to: ${to}`)
      console.log(`📧 [DEV MODE] Subject: ${content.subject}`)
    }
  }
}

interface EmailContent {
  subject: string
  html: string
}

interface NotificationResult {
  totalPending: number
  sent: number
  failed: number
  errors: string[]
}
