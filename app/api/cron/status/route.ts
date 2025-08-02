import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Check last recall sync
    const lastRecall = await sql`
      SELECT created_at, updated_at, agency 
      FROM recalls 
      ORDER BY updated_at DESC 
      LIMIT 1
    `

    // Check total recalls by agency
    const recallStats = await sql`
      SELECT 
        agency,
        COUNT(*) as total,
        MAX(updated_at) as last_updated
      FROM recalls 
      GROUP BY agency
      ORDER BY total DESC
    `

    // Check users with products
    const userStats = await sql`
      SELECT COUNT(DISTINCT user_id) as users_with_products
      FROM products
    `

    // Check recent user recalls (matches)
    const recentMatches = await sql`
      SELECT COUNT(*) as recent_matches
      FROM user_recalls
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      lastRecallUpdate: lastRecall[0]?.updated_at || null,
      recallStats: recallStats,
      usersWithProducts: userStats[0]?.users_with_products || 0,
      recentMatches: recentMatches[0]?.recent_matches || 0,
      environment: {
        hasCronSecret: !!process.env.CRON_SECRET,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("Status check failed:", error)
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
