import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check database connectivity
    const dbCheck = await sql`SELECT NOW() as current_time`

    // Get recall statistics
    const recallStats = await sql`
      SELECT 
        source,
        COUNT(*) as count,
        MAX(date_published) as latest_recall
      FROM recalls 
      GROUP BY source
      ORDER BY count DESC
    `

    // Get recent recalls
    const recentRecalls = await sql`
      SELECT external_id, source, title, date_published, severity
      FROM recalls 
      ORDER BY date_published DESC 
      LIMIT 5
    `

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        current_time: dbCheck[0].current_time,
      },
      recalls: {
        by_source: recallStats,
        recent: recentRecalls,
        total: recallStats.reduce((sum, stat) => sum + Number.parseInt(stat.count), 0),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Status check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
