import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS magic_links (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        model VARCHAR(255),
        upc VARCHAR(255),
        purchase_date DATE,
        purchase_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS recalls (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        severity VARCHAR(50) DEFAULT 'medium',
        date_published DATE,
        source VARCHAR(255),
        product_name VARCHAR(255),
        brand VARCHAR(255),
        model VARCHAR(255),
        upc VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS user_recall_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recall_id INTEGER REFERENCES recalls(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'new',
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("✅ Database tables initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user from session
    const sessions = await sql`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} 
      AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = sessions[0]

    // Get user's products
    const products = await sql`
      SELECT * FROM products 
      WHERE user_id = ${user.user_id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ products })
  } catch (error) {
    console.error("❌ Get products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user from session
    const sessions = await sql`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} 
      AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = sessions[0]
    const body = await request.json()

    const { name, brand, model, upc, purchase_date, purchase_price } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // Insert product
    const products = await sql`
      INSERT INTO products (
        user_id, name, brand, model, upc, purchase_date, purchase_price, created_at, updated_at
      ) VALUES (
        ${user.user_id}, 
        ${name.trim()}, 
        ${brand}, 
        ${model}, 
        ${upc}, 
        ${purchase_date}, 
        ${purchase_price}, 
        NOW(), 
        NOW()
      )
      RETURNING *
    `

    const product = products[0]

    console.log("✅ Product added successfully:", product.name)

    return NextResponse.json({
      success: true,
      product,
      message: "Product added successfully!",
    })
  } catch (error) {
    console.error("❌ Add product error:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
