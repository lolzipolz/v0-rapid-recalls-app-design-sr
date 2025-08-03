import { type NextRequest, NextResponse } from "next/server"
import { RecallIngestionService } from "@/lib/services/recall-ingestion"

export async function GET(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("❌ CRON_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚀 Starting scheduled recall sync...")
    const startTime = Date.now()

    const recallService = RecallIngestionService.getInstance()
    const results = await recallService.syncAllRecalls()

    const duration = Date.now() - startTime
    console.log(`⏱️ Sync completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Cron sync failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
