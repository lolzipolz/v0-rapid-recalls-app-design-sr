import { type NextRequest, NextResponse } from "next/server"
import { sql, testDatabaseConnection, initializeDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...")

    // Test basic connection
    await testDatabaseConnection()

    // Initialize database
    await initializeDatabase()

    // Test queries
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    const recallCount = await sql`SELECT COUNT(*) as count FROM recalls`

    const info = {
      status: "✅ Database connection successful",
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      tables: {
        users: userCount[0].count,
        products: productCount[0].count,
        recalls: recallCount[0].count,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    console.log("Database info:", info)

    return NextResponse.json(info)
  } catch (error) {
    console.error("❌ Database debug error:", error)

    const errorInfo = {
      status: "❌ Database connection failed",
      error: error.message,
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorInfo, { status: 500 })
  }
}
