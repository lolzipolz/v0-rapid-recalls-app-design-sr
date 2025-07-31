import { type NextRequest, NextResponse } from "next/server"
import { sql, testDatabaseConnection, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...")

    // Test basic connection
    await testDatabaseConnection()

    // Initialize database
    await initializeDatabase()

    // Get some basic stats
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    const recallCount = await sql`SELECT COUNT(*) as count FROM recalls`

    const stats = {
      users: userCount[0].count,
      products: productCount[0].count,
      recalls: recallCount[0].count,
    }

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      stats,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasSendGrid: !!process.env.SENDGRID_API_KEY,
        hasFromEmail: !!process.env.FROM_EMAIL,
      },
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
