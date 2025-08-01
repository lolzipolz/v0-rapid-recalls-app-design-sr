import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

let isInitialized = false

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

// Helper function to get current user from session
export async function getCurrentUser(sessionToken: string) {
  if (!sessionToken) return null

  try {
    const users = await sql`
      SELECT id, email, notification_preferences, created_at, last_login, session_expires
      FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

export async function initializeDatabase() {
  if (isInitialized) return

  try {
    console.log("🔧 Initializing database schema...")

    // Test connection first
    await testDatabaseConnection()

    // Check if tables exist
    const tablesExist = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'products', 'recalls', 'matched_recalls')
    `

    if (tablesExist.length === 4) {
      console.log("✅ Database tables already exist")
      isInitialized = true
      return
    }

    console.log("🔧 Creating database tables...")

    // Create users table with all required columns
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        session_token VARCHAR(255),
        session_expires TIMESTAMP WITH TIME ZONE,
        magic_link_token VARCHAR(255),
        magic_link_expires TIMESTAMP WITH TIME ZONE,
        notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        source VARCHAR(50) NOT NULL DEFAULT 'manual',
        source_metadata JSONB DEFAULT '{}',
        normalized_name VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(product_id, recall_id)
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_magic_link ON users(magic_link_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recalls_agency ON recalls(agency)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recalls_date ON recalls(recall_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_user ON matched_recalls(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_product ON matched_recalls(product_id)`

    isInitialized = true
    console.log("✅ Database schema initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}
