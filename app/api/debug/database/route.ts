import { type NextRequest, NextResponse } from "next/server"
import { sql, testDatabaseConnection, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...")

    // Test basic connection
    await testDatabaseConnection()

    // Initialize database schema
    await initializeDatabase()

    // Test queries
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    const recallCount = await sql`SELECT COUNT(*) as count FROM recalls`

    const dbInfo = {
      status: "✅ Connected",
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      tables: {
        users: userCount[0].count,
        products: productCount[0].count,
        recalls: recallCount[0].count,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    console.log("Database info:", dbInfo)

    return NextResponse.json(dbInfo)
  } catch (error) {
    console.error("❌ Database debug error:", error)

    const errorInfo = {
      status: "❌ Error",
      error: error instanceof Error ? error.message : "Unknown error",
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorInfo, { status: 500 })
  }
}
