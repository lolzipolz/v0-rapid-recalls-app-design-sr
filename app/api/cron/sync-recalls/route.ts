import { type NextRequest, NextResponse } from "next/server"
import { RecallIngestionService } from "@/lib/services/recall-ingestion"
import { MatchingEngine } from "@/lib/services/matching-engine"
import { NotificationService } from "@/lib/services/notification-service"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron job
    const authHeader = request.headers.get("authorization")
    const vercelCronHeader = request.headers.get("x-vercel-cron")
    
    // Allow either Vercel's built-in cron header OR our custom secret
    const isVercelCron = vercelCronHeader === "1"
    const isCustomAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    if (!isVercelCron && !isCustomAuth) {
      console.log("❌ Unauthorized cron request:", {
        hasVercelCron: !!vercelCronHeader,
        hasCustomAuth: !!authHeader,
        vercelCronValue: vercelCronHeader,
        authValue: authHeader?.substring(0, 20) + "..."
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚀 Starting daily recall sync...")
    const startTime = Date.now()

    // 1. Sync recalls from government APIs
    console.log("📡 Syncing recalls from government APIs...")
    const recallService = RecallIngestionService.getInstance()
    const syncResults = await recallService.syncAllRecalls()

    // 2. Run matching for all users with products
    console.log("🔍 Running matching engine for all users...")
    const users = await sql`
      SELECT DISTINCT user_id as id 
      FROM products 
      WHERE created_at >= NOW() - INTERVAL '1 year'
    `

    const matchingEngine = MatchingEngine.getInstance()
    let totalNewMatches = 0

    for (const user of users) {
      try {
        const matchResult = await matchingEngine.findMatches(user.id)
        totalNewMatches += matchResult.newMatches || 0
      } catch (error) {
        console.error(`Matching failed for user ${user.id}:`, error)
      }
    }

    // 3. Send notifications for new matches
    console.log("📧 Sending notifications...")
    const notificationService = NotificationService.getInstance()
    await notificationService.sendPendingNotifications()

    const totalTime = Date.now() - startTime

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${totalTime}ms`,
      syncResults,
      usersProcessed: users.length,
      newMatches: totalNewMatches,
      message: "Daily recall sync completed successfully",
    }

    console.log("✅ Daily recall sync completed:", summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("❌ Recall sync failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Recall sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Convert to POST request
  return POST(request)
}
