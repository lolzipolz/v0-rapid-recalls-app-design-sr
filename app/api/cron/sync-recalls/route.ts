import { type NextRequest, NextResponse } from "next/server"
import { RecallIngestionService } from "@/lib/services/recall-ingestion"
import { MatchingEngine } from "@/lib/services/matching-engine"
import { NotificationService } from "@/lib/services/notification-service"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // For debugging - log all request details
    console.log("🔍 Cron request received:", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    })

    // Simple security check using URL parameter
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get("secret")
    const envSecret = process.env.CRON_SECRET

    console.log("🔐 Auth check detailed:", {
      secretParam: secretParam,
      secretParamLength: secretParam?.length,
      envSecret: envSecret,
      envSecretLength: envSecret?.length,
      match: secretParam === envSecret,
      secretParamType: typeof secretParam,
      envSecretType: typeof envSecret,
    })

    if (secretParam !== envSecret) {
      console.log("❌ Authentication failed - values don't match")
      return NextResponse.json(
        {
          error: "Unauthorized",
          debug: {
            hasSecret: !!secretParam,
            hasEnvVar: !!envSecret,
            secretLength: secretParam?.length,
            envLength: envSecret?.length,
          },
        },
        { status: 401 },
      )
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
  console.log("🔍 GET request received for cron endpoint")

  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const envSecret = process.env.CRON_SECRET

  console.log("🔐 GET Auth check detailed:", {
    secretParam: secret,
    secretParamLength: secret?.length,
    envSecret: envSecret,
    envSecretLength: envSecret?.length,
    match: secret === envSecret,
    secretParamType: typeof secret,
    envSecretType: typeof envSecret,
  })

  if (secret !== envSecret) {
    console.log("❌ GET Authentication failed - values don't match")
    return NextResponse.json(
      {
        error: "Unauthorized",
        debug: {
          hasSecret: !!secret,
          hasEnvVar: !!envSecret,
          secretLength: secret?.length,
          envLength: envSecret?.length,
        },
      },
      { status: 401 },
    )
  }

  // Convert to POST request for testing
  console.log("✅ GET auth passed, converting to POST")
  return POST(request)
}
