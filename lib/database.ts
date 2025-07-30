import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

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
