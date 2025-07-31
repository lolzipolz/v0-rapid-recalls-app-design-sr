import { neon } from "@neondatabase/serverless"

// Check for required environment variable
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set")
}

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

// Database types
export interface User {
  id: string
  email: string
  email_verified: boolean
  notification_preferences: {
    email: boolean
    push: boolean
  }
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  brand?: string
  model?: string
  upc?: string
  purchase_date?: string
  purchase_price?: number
  source: "manual" | "receipt_ocr" | "amazon_csv" | "upc_scan"
  source_metadata: Record<string, any>
  normalized_name?: string
  created_at: string
  updated_at: string
}

export interface Recall {
  id: string
  agency: "FDA" | "USDA" | "CPSC" | "NHTSA"
  recall_number: string
  title: string
  description?: string
  recall_date: string
  link?: string
  severity: "low" | "medium" | "high"
  product_keywords: string[]
  upcs: string[]
  brands: string[]
  raw_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MatchedRecall {
  id: string
  user_id: string
  product_id: string
  recall_id: string
  match_type: "upc_exact" | "title_fuzzy" | "brand_fuzzy"
  confidence_score: number
  notified_at?: string
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

// Test database connection
export async function testDatabaseConnection() {
  if (!sql) {
    throw new Error("Database connection not available. DATABASE_URL environment variable is missing.")
  }

  try {
    console.log("🔍 Testing database connection...")
    const result = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Initialize database on first use
export async function initializeDatabase() {
  if (!sql) {
    throw new Error("Database connection not available. Please set DATABASE_URL environment variable.")
  }

  try {
    // First test the connection
    await testDatabaseConnection()

    console.log("🔧 Checking database schema...")

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'products', 'recalls', 'matched_recalls', 'notification_log')
    `

    console.log(`📊 Found ${tables.length} existing tables`)

    if (tables.length < 5) {
      console.log("🔧 Initializing database schema...")

      // Create extension first
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

      // Users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Products table
      await sql`
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(500) NOT NULL,
            brand VARCHAR(255),
            model VARCHAR(255),
            upc VARCHAR(20),
            purchase_date DATE,
            purchase_price DECIMAL(10,2),
            source VARCHAR(50) NOT NULL CHECK (source IN ('manual', 'receipt_ocr', 'amazon_csv', 'upc_scan')),
            source_metadata JSONB DEFAULT '{}',
            normalized_name VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Recalls table
      await sql`
        CREATE TABLE IF NOT EXISTS recalls (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agency VARCHAR(50) NOT NULL CHECK (agency IN ('FDA', 'USDA', 'CPSC', 'NHTSA')),
            recall_number VARCHAR(100) UNIQUE NOT NULL,
            title VARCHAR(1000) NOT NULL,
            description TEXT,
            recall_date DATE NOT NULL,
            link VARCHAR(1000),
            severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
            product_keywords TEXT[],
            upcs TEXT[],
            brands TEXT[],
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Matched recalls table
      await sql`
        CREATE TABLE IF NOT EXISTS matched_recalls (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            recall_id UUID NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
            match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('upc_exact', 'title_fuzzy', 'brand_fuzzy')),
            confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
            notified_at TIMESTAMP WITH TIME ZONE,
            acknowledged_at TIMESTAMP WITH TIME ZONE,
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(product_id, recall_id)
        )
      `

      // Notification log table
      await sql`
        CREATE TABLE IF NOT EXISTS notification_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            matched_recall_id UUID NOT NULL REFERENCES matched_recalls(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push')),
            status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
            sent_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc) WHERE upc IS NOT NULL`
      await sql`CREATE INDEX IF NOT EXISTS idx_products_normalized_name ON products USING gin(to_tsvector('english', normalized_name))`
      await sql`CREATE INDEX IF NOT EXISTS idx_recalls_agency ON recalls(agency)`
      await sql`CREATE INDEX IF NOT EXISTS idx_recalls_recall_date ON recalls(recall_date)`
      await sql`CREATE INDEX IF NOT EXISTS idx_recalls_keywords ON recalls USING gin(product_keywords)`
      await sql`CREATE INDEX IF NOT EXISTS idx_recalls_upcs ON recalls USING gin(upcs)`
      await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_user_id ON matched_recalls(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_matched_recalls_notified ON matched_recalls(notified_at) WHERE notified_at IS NULL`

      console.log("✅ Database schema initialized successfully")
    } else {
      console.log("✅ Database schema already exists")
    }

    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}
