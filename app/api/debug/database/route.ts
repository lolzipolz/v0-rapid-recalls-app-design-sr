import { type NextRequest, NextResponse } from "next/server"
import { sql, testDatabaseConnection, initializeDatabase } from "@/lib/database"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + "...",
    },
    tests: {} as Record<string, any>,
  }

  try {
    // Test 1: Basic connection
    console.log("🔍 Testing database connection...")
    await testDatabaseConnection()
    results.tests.connection = { status: "✅ SUCCESS", message: "Database connection successful" }
  } catch (error) {
    results.tests.connection = {
      status: "❌ FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  try {
    // Test 2: Schema initialization
    console.log("🔍 Testing schema initialization...")
    await initializeDatabase()
    results.tests.schema = { status: "✅ SUCCESS", message: "Schema initialization successful" }
  } catch (error) {
    results.tests.schema = {
      status: "❌ FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  try {
    // Test 3: Simple query
    console.log("🔍 Testing simple query...")
    const result = await sql`SELECT COUNT(*) as user_count FROM users`
    results.tests.query = {
      status: "✅ SUCCESS",
      message: "Query successful",
      user_count: result[0].user_count,
    }
  } catch (error) {
    results.tests.query = {
      status: "❌ FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  const allTestsPassed = Object.values(results.tests).every((test) => test.status.includes("SUCCESS"))

  return NextResponse.json(results, {
    status: allTestsPassed ? 200 : 500,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
