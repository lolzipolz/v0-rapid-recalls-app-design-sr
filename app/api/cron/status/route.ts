import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("🔍 Checking cron status...")

    // Check database connection
    const dbCheck = await sql`SELECT NOW() as current_time`

    // Get recall counts by source
    const recallCounts = await sql`
      SELECT 
        source,
        COUNT(*) as count,
        MAX(date_published) as latest_recall,
        MAX(updated_at) as last_updated
      FROM recalls 
      GROUP BY source
      ORDER BY source
    `

    // Get total recall count
    const totalCount = await sql`SELECT COUNT(*) as total FROM recalls`

    // Get recent recalls (last 24 hours)
    const recentRecalls = await sql`
      SELECT COUNT(*) as recent_count 
      FROM recalls 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `

    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        current_time: dbCheck[0]?.current_time,
      },
      recalls: {
        total: Number.parseInt(totalCount[0]?.total || "0"),
        recent_24h: Number.parseInt(recentRecalls[0]?.recent_count || "0"),
        by_source: recallCounts.map((row) => ({
          source: row.source,
          count: Number.parseInt(row.count),
          latest_recall: row.latest_recall,
          last_updated: row.last_updated,
        })),
      },
      environment: {
        cron_secret_set: !!process.env.CRON_SECRET,
        node_env: process.env.NODE_ENV,
      },
    }

    console.log("✅ Cron status check completed:", status)
    return NextResponse.json(status)
  } catch (error) {
    console.error("❌ Cron status check failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
        },
      },
      { status: 500 },
    )
  }
}
