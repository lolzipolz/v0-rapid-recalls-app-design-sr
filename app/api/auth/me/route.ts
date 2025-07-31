import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }

    const user = await getCurrentUser(sessionToken)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Don't send sensitive data to client
    const { session_token, magic_link_token, ...safeUser } = user

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json({ user: null })
  }
}
