import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Check database connectivity
    const dbCheck = await sql`SELECT NOW() as current_time`

    // Get recall statistics
    const recallStats = await sql`
      SELECT 
        source,
        COUNT(*) as count,
        MAX(date_published) as latest_recall,
        MAX(updated_at) as last_updated
      FROM recalls 
      GROUP BY source
    `

    // Get user statistics
    const userStats = await sql`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_products
      FROM products
    `

    // Get recent cron activity (if we had a cron_logs table)
    const cronStatus = {
      database_connected: true,
      database_time: dbCheck[0].current_time,
      recall_sources: recallStats,
      user_stats: userStats[0],
      last_check: new Date().toISOString(),
    }

    return NextResponse.json({
      status: "healthy",
      ...cronStatus,
    })
  } catch (error) {
    console.error("Cron status check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
