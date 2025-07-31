import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase, testDatabaseConnection } from "@/lib/database"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🚀 POST /api/users - Starting user creation")

  try {
    // Log environment check
    const hasDbUrl = !!process.env.DATABASE_URL
    console.log(`🔍 Environment check - DATABASE_URL exists: ${hasDbUrl}`)

    if (!hasDbUrl) {
      console.error("❌ DATABASE_URL environment variable is missing")
      return NextResponse.json({ error: "Database configuration error. Please contact support." }, { status: 503 })
    }

    // Test database connection first
    try {
      await testDatabaseConnection()
    } catch (dbError) {
      console.error("❌ Database connection test failed:", dbError)
      return NextResponse.json(
        {
          error: "Unable to connect to database. Please try again in a moment.",
          details:
            process.env.NODE_ENV === "development"
              ? dbError instanceof Error
                ? dbError.message
                : "Unknown error"
              : undefined,
        },
        { status: 503 },
      )
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (initError) {
      console.error("❌ Database initialization failed:", initError)
      return NextResponse.json(
        {
          error: "Database setup error. Please try again.",
          details:
            process.env.NODE_ENV === "development"
              ? initError instanceof Error
                ? initError.message
                : "Unknown error"
              : undefined,
        },
        { status: 503 },
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { email } = body

    if (!email || typeof email !== "string") {
      console.log("❌ Invalid email provided")
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    console.log(`📧 Processing email: ${cleanEmail}`)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      console.log("❌ Email format validation failed")
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Check if user already exists
    console.log("🔍 Checking for existing user...")
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${cleanEmail}
    `

    if (existingUser.length > 0) {
      console.log(`✅ Existing user found: ${cleanEmail}`)
      return NextResponse.json({
        user: existingUser[0],
        message: "Welcome back!",
      })
    }

    // Create new user
    console.log("👤 Creating new user...")
    const newUser = await sql`
      INSERT INTO users (email, notification_preferences)
      VALUES (${cleanEmail}, '{"email": true, "push": false}')
      RETURNING *
    `

    console.log(`🎉 New user created successfully: ${cleanEmail}`)

    return NextResponse.json({
      user: newUser[0],
      message: "Account created successfully! Welcome to RapidRecalls.",
    })
  } catch (error) {
    console.error("❌ Unexpected error in user creation:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }

      if (error.message.includes("connection") || error.message.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Database connection issue. Please try again.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create account. Please try again.",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const user = await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: user[0] })
  } catch (error) {
    console.error("❌ Failed to fetch user:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}
