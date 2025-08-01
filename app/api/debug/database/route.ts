import { NextResponse } from "next/server"
import { sql, initializeDatabase, testDatabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    console.log("🔍 Starting database debug check...")

    // Test basic connection
    await testDatabaseConnection()

    // Initialize database (create tables if needed)
    await initializeDatabase()

    // Check table structure
    const tables = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'products', 'recalls', 'matched_recalls')
      ORDER BY table_name, ordinal_position
    `

    // Count records in each table
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    const recallCount = await sql`SELECT COUNT(*) as count FROM recalls`
    const matchedRecallCount = await sql`SELECT COUNT(*) as count FROM matched_recalls`

    // Get sample data
    const sampleUsers = await sql`SELECT id, email, created_at FROM users LIMIT 3`

    return NextResponse.json({
      status: "✅ Database connection successful",
      tables: {
        structure: tables,
        counts: {
          users: userCount[0].count,
          products: productCount[0].count,
          recalls: recallCount[0].count,
          matched_recalls: matchedRecallCount[0].count,
        },
      },
      sample_data: {
        users: sampleUsers,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Database debug failed:", error)
    return NextResponse.json(
      {
        status: "❌ Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
