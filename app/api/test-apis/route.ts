import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Log all headers to see what Vercel sends
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  const userAgent = request.headers.get("user-agent") || ""
  const isVercelCron = userAgent.includes("Vercel") || userAgent.includes("vercel")

  return NextResponse.json({
    message: "API test endpoint",
    timestamp: new Date().toISOString(),
    headers,
    userAgent,
    isVercelCron,
    hasAuthorization: !!request.headers.get("authorization"),
    hasVercelCronHeader: !!request.headers.get("x-vercel-cron"),
    vercelCronValue: request.headers.get("x-vercel-cron"),
  })
}

export async function POST(request: NextRequest) {
  // Test the cron endpoint logic
  const authHeader = request.headers.get("authorization")
  const userAgent = request.headers.get("user-agent") || ""
  const { searchParams } = new URL(request.url)
  const secretParam = searchParams.get("secret")
  
  const isVercelCron = userAgent.includes("Vercel") || userAgent.includes("vercel")
  const isCustomAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isSecretParam = secretParam === process.env.CRON_SECRET
  
  return NextResponse.json({
    message: "Cron test endpoint",
    timestamp: new Date().toISOString(),
    userAgent,
    isVercelCron,
    isCustomAuth,
    isSecretParam,
    hasCustomAuthHeader: !!authHeader,
    hasSecretParam: !!secretParam,
    authValue: authHeader?.substring(0, 20) + "...",
    secretValue: secretParam?.substring(0, 10) + "...",
    authorized: isVercelCron || isCustomAuth || isSecretParam,
    cronSecret: process.env.CRON_SECRET ? "Set" : "Not set",
  })
}
