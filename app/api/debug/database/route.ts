import { type NextRequest, NextResponse } from "next/server"
import { sql, testDatabaseConnection, initializeDatabase } from "@/lib/database"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
    tests: {} as Record<string, any>,
  }

  try {
    // Test 1: Basic connection
    debug.tests.connection = await testDatabaseConnection()
      .then(() => ({ success: true, message: "Connection successful" }))
      .catch((error) => ({ success: false, error: error.message }))

    // Test 2: Database initialization
    debug.tests.initialization = await initializeDatabase()
      .then(() => ({ success: true, message: "Schema ready" }))
      .catch((error) => ({ success: false, error: error.message }))

    // Test 3: Query test
    if (sql) {
      debug.tests.query = await sql`SELECT COUNT(*) as user_count FROM users`
        .then((result) => ({ success: true, userCount: result[0].user_count }))
        .catch((error) => ({ success: false, error: error.message }))
    }

    // Test 4: Table check
    if (sql) {
      debug.tests.tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
        .then((result) => ({ success: true, tables: result.map((r) => r.table_name) }))
        .catch((error) => ({ success: false, error: error.message }))
    }

    return NextResponse.json(debug)
  } catch (error) {
    debug.tests.error = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }

    return NextResponse.json(debug, { status: 500 })
  }
}
