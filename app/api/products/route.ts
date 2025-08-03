import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/database"
import { MatchingEngine } from "@/lib/services/matching-engine"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const users = await sql`
      SELECT id FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = users[0].id

    // Get user's products
    const products = await sql`
      SELECT id, name, brand, model, upc, purchase_date, purchase_price, source, created_at
      FROM products 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Failed to get products:", error)
    return NextResponse.json({ error: "Failed to get products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const users = await sql`
      SELECT id FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = users[0].id
    const { name, brand, model, upc, purchase_date, purchase_price } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // Create normalized name for matching
    const normalizedName = name.toLowerCase().trim()

    // Insert product
    const products = await sql`
      INSERT INTO products (
        user_id, name, brand, model, upc, purchase_date, purchase_price, 
        source, normalized_name
      )
      VALUES (
        ${userId}, ${name.trim()}, ${brand || null}, ${model || null}, 
        ${upc || null}, ${purchase_date || null}, ${purchase_price || null},
        'manual', ${normalizedName}
      )
      RETURNING id, name, brand, model, upc, purchase_date, purchase_price, source, created_at
    `

    console.log(`✅ Product added: ${name} for user ${userId}`)

    // After adding the product, trigger the matching engine asynchronously
    const newProduct = products[0]
    MatchingEngine.getInstance().findMatches(userId, newProduct.id)
    console.log(`✅ Triggered matching engine for product ${newProduct.id}`)

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Product added successfully",
    })
  } catch (error) {
    console.error("Failed to add product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
