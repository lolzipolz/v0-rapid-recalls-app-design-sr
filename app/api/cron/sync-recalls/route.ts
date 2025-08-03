import { type NextRequest, NextResponse } from "next/server"
import { RecallIngestionService } from "@/lib/services/recall-ingestion"

export async function GET(request: NextRequest) {
  console.log("🔍 GET request received for cron endpoint")

  try {
    // Check authentication
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get("secret")
    const envSecret = process.env.CRON_SECRET

    console.log("🔐 GET Auth check:", {
      secretParam: secretParam ? "provided" : "missing",
      envSecret: envSecret ? "set" : "missing",
      match: secretParam === envSecret,
    })

    if (secretParam !== envSecret) {
      console.log("❌ GET Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ GET Authentication successful")

    // Run recall sync
    const recallService = RecallIngestionService.getInstance()
    const results = await recallService.syncAllRecalls()

    console.log("🎯 GET Sync completed:", results)

    return NextResponse.json({
      success: true,
      message: "Recall sync completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ GET Cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("🔍 POST request received for cron endpoint")

  try {
    // Check authentication
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get("secret")
    const envSecret = process.env.CRON_SECRET

    console.log("🔐 POST Auth check:", {
      secretParam: secretParam ? "provided" : "missing",
      envSecret: envSecret ? "set" : "missing",
      match: secretParam === envSecret,
    })

    if (secretParam !== envSecret) {
      console.log("❌ POST Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ POST Authentication successful")

    // Run recall sync
    const recallService = RecallIngestionService.getInstance()
    const results = await recallService.syncAllRecalls()

    console.log("🎯 POST Sync completed:", results)

    return NextResponse.json({
      success: true,
      message: "Recall sync completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ POST Cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
