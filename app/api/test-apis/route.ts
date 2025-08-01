import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Log all headers to see what Vercel sends
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  return NextResponse.json({
    message: "API test endpoint",
    timestamp: new Date().toISOString(),
    headers,
    userAgent: request.headers.get("user-agent"),
    hasVercelCron: request.headers.get("x-vercel-cron") === "1",
    hasAuthorization: !!request.headers.get("authorization"),
  })
}

export async function POST(request: NextRequest) {
  // Test the cron endpoint logic
  const authHeader = request.headers.get("authorization")
  const vercelCronHeader = request.headers.get("x-vercel-cron")
  
  const isVercelCron = vercelCronHeader === "1"
  const isCustomAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  return NextResponse.json({
    message: "Cron test endpoint",
    timestamp: new Date().toISOString(),
    isVercelCron,
    isCustomAuth,
    hasVercelCronHeader: !!vercelCronHeader,
    hasCustomAuthHeader: !!authHeader,
    vercelCronValue: vercelCronHeader,
    authValue: authHeader?.substring(0, 20) + "...",
    authorized: isVercelCron || isCustomAuth,
  })
}
