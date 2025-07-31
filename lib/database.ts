import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return result
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    throw error
  }
}

export async function initializeDatabase() {
  try {
    console.log("🔧 Initializing database schema...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        session_token VARCHAR(255),
        session_expires TIMESTAMP,
        magic_link_token VARCHAR(255),
        magic_link_expires TIMESTAMP,
        notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(500) NOT NULL,
        brand VARCHAR(255),
        model VARCHAR(255),
        upc VARCHAR(50),
        purchase_date DATE,
        purchase_price DECIMAL(10,2),
        source VARCHAR(50) NOT NULL,
        source_metadata JSONB DEFAULT '{}',
        normalized_name VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recalls table
    await sql`
      CREATE TABLE IF NOT EXISTS recalls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(1000) NOT NULL,
        description TEXT,
        agency VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        recall_date DATE NOT NULL,
        link VARCHAR(1000),
        product_keywords TEXT[],
        brand_keywords TEXT[],
        upc_codes TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create matched_recalls table
    await sql`
      CREATE TABLE IF NOT EXISTS matched_recalls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        recall_id UUID NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
        match_type VARCHAR(50) NOT NULL,
        confidence_score DECIMAL(3,2) NOT NULL,
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, recall_id)
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recalls_agency ON recalls(agency)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recalls_date ON recalls(recall_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_user ON matched_recalls(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_product ON matched_recalls(product_id)`

    console.log("✅ Database schema initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}
