import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

let isInitialized = false

export async function initializeDatabase() {
  if (isInitialized) return

  try {
    console.log("🔄 Initializing database...")

    // Create users table with session support
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
        magic_link_token VARCHAR(255),
        magic_link_expires TIMESTAMP,
        session_token VARCHAR(255),
        session_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        upc VARCHAR(50),
        category VARCHAR(100),
        image_url TEXT,
        purchase_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recalls table
    await sql`
      CREATE TABLE IF NOT EXISTS recalls (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        agency VARCHAR(100) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        recall_date DATE NOT NULL,
        link TEXT,
        affected_products JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create matched_recalls table
    await sql`
      CREATE TABLE IF NOT EXISTS matched_recalls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        recall_id INTEGER REFERENCES recalls(id) ON DELETE CASCADE,
        confidence_score DECIMAL(3,2) NOT NULL,
        match_reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        notified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id, recall_id)
      )
    `

    // Create notification_log table
    await sql`
      CREATE TABLE IF NOT EXISTS notification_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        matched_recall_id INTEGER REFERENCES matched_recalls(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
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
    await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_status ON matched_recalls(status)`

    isInitialized = true
    console.log("✅ Database initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

// Helper function to get current user from session
export async function getCurrentUser(sessionToken: string) {
  if (!sessionToken) return null

  try {
    const users = await sql`
      SELECT * FROM users 
      WHERE session_token = ${sessionToken} 
      AND session_expires > NOW()
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}
