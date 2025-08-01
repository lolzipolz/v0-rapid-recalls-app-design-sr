import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase, getCurrentUser } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get current user
    const user = await getCurrentUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const products = await sql`
      SELECT * FROM products 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get current user
    const user = await getCurrentUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const body = await request.json()
    const { name, brand, model, upc, purchase_date, purchase_price } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // Normalize product name for better matching
    const normalizedName = name
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Insert product
    const result = await sql`
      INSERT INTO products (
        user_id, name, brand, model, upc, purchase_date, 
        purchase_price, source, normalized_name
      ) VALUES (
        ${user.id}, ${name.trim()}, ${brand?.trim() || null}, 
        ${model?.trim() || null}, ${upc?.trim() || null}, 
        ${purchase_date || null}, ${purchase_price || null},
        'manual', ${normalizedName}
      )
      RETURNING *
    `

    const product = result[0]

    console.log(`✅ Product added: ${product.name} for user ${user.email}`)

    return NextResponse.json({
      message: "Product added successfully",
      product,
    })
  } catch (error) {
    console.error("Failed to add product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
