import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Check database connectivity
    const dbCheck = await sql`SELECT NOW() as current_time`

    // Get recall counts by source
    const recallCounts = await sql`
      SELECT 
        source,
        COUNT(*) as count,
        MAX(created_at) as last_sync
      FROM recalls 
      GROUP BY source
      ORDER BY source
    `

    // Get user and product counts
    const userStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM recall_matches WHERE status = 'pending') as pending_matches
    `

    // Get recent cron activity (if we had a cron_logs table)
    const recentActivity = await sql`
      SELECT 
        COUNT(*) as recalls_last_24h
      FROM recalls 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        current_time: dbCheck[0].current_time,
      },
      recalls: recallCounts,
      stats: userStats[0],
      recent_activity: recentActivity[0],
      cron_config: {
        schedule: "0 6 * * *", // Daily at 6 AM UTC
        next_run: "Check Vercel dashboard for next scheduled run",
      },
    })
  } catch (error) {
    console.error("Status check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
