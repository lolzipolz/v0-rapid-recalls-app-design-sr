import { sql } from "@/lib/database"

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendPendingNotifications(): Promise<void> {
    console.log("📧 Checking for pending notifications...")

    try {
      // Get users with new matches that haven't been notified
      const pendingNotifications = await sql`
        SELECT DISTINCT 
          u.id as user_id,
          u.email,
          u.name,
          COUNT(prm.id) as new_matches
        FROM users u
        JOIN products p ON p.user_id = u.id
        JOIN product_recall_matches prm ON prm.product_id = p.id
        LEFT JOIN notifications n ON n.user_id = u.id 
          AND n.recall_id = prm.recall_id 
          AND n.type = 'recall_match'
        WHERE n.id IS NULL
          AND prm.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY u.id, u.email, u.name
        HAVING COUNT(prm.id) > 0
      `

      console.log(`📊 Found ${pendingNotifications.length} users with pending notifications`)

      for (const notification of pendingNotifications) {
        await this.sendRecallNotification(notification)
      }

      console.log("✅ Pending notifications processed")
    } catch (error) {
      console.error("❌ Error sending pending notifications:", error)
      throw error
    }
  }

  private async sendRecallNotification(notification: any): Promise<void> {
    console.log(`📧 Sending notification to user: ${notification.email}`)

    try {
      // Get the specific matches for this user
      const matches = await sql`
        SELECT 
          p.name as product_name,
          r.title as recall_title,
          r.description as recall_description,
          r.severity,
          r.date_published,
          r.source,
          prm.match_confidence
        FROM products p
        JOIN product_recall_matches prm ON prm.product_id = p.id
        JOIN recalls r ON r.id = prm.recall_id
        LEFT JOIN notifications n ON n.user_id = p.user_id 
          AND n.recall_id = r.id 
          AND n.type = 'recall_match'
        WHERE p.user_id = ${notification.user_id}
          AND n.id IS NULL
          AND prm.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY r.severity DESC, prm.match_confidence DESC
      `

      if (matches.length === 0) {
        console.log(`⚠️ No matches found for user ${notification.email}`)
        return
      }

      // In a real implementation, you would send an actual email here
      // For now, we'll just log the notification and mark it as sent
      console.log(`📧 Would send email to ${notification.email} about ${matches.length} recall matches`)

      // Mark notifications as sent
      for (const match of matches) {
        const recallId = await sql`
          SELECT id FROM recalls 
          WHERE title = ${match.recall_title} 
          LIMIT 1
        `

        if (recallId.length > 0) {
          await sql`
            INSERT INTO notifications (user_id, recall_id, type, sent_at, created_at)
            VALUES (${notification.user_id}, ${recallId[0].id}, 'recall_match', NOW(), NOW())
            ON CONFLICT (user_id, recall_id, type) DO NOTHING
          `
        }
      }

      console.log(`✅ Notification sent to ${notification.email}`)
    } catch (error) {
      console.error(`❌ Error sending notification to ${notification.email}:`, error)
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Postmark

    console.log(`📧 Mock email sent to: ${to}`)
    console.log(`📧 Subject: ${subject}`)
    console.log(`📧 Body: ${body.substring(0, 100)}...`)

    return true
  }
}
