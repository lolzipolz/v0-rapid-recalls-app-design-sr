import { sql } from "@/lib/database"

// Define match types and their confidence scores
const MATCH_TYPES = {
  EXACT_UPC: { type: "exact_upc", score: 0.95 },
  UPC_SUBSTRING: { type: "upc_substring", score: 0.8 },
  NAME_KEYWORD: { type: "name_keyword", score: 0.7 },
  BRAND: { type: "brand", score: 0.6 },
}

// Type definitions for our data structures
interface Product {
  id: string
  name: string
  normalized_name: string
  brand?: string
  upc?: string
}

interface Recall {
  id: string
  title: string
  description?: string
  product_keywords?: string[]
  brand_keywords?: string[]
  upc_codes?: string[]
}

export class MatchingEngine {
  private static instance: MatchingEngine

  static getInstance(): MatchingEngine {
    if (!MatchingEngine.instance) {
      MatchingEngine.instance = new MatchingEngine()
    }
    return MatchingEngine.instance
  }

  async findMatches(userId: string, productId?: string): Promise<{ newMatches: number }> {
    console.log(`🔍 Finding matches for user: ${userId}` + (productId ? ` for product ${productId}` : ""))
    try {
      let userProducts: Product[]
      if (productId) {
        userProducts = await sql<Product[]>`
          SELECT id, name, brand, upc, normalized_name
          FROM products WHERE user_id = ${userId} AND id = ${productId}
        `
      } else {
        userProducts = await sql<Product[]>`
          SELECT id, name, brand, upc, normalized_name
          FROM products WHERE user_id = ${userId}
        `
      }

      if (userProducts.length === 0) {
        console.log(`📦 No products found for user ${userId}`)
        return { newMatches: 0 }
      }
      console.log(`📦 Found ${userProducts.length} products for user ${userId}`)
      let totalNewMatches = 0
      for (const product of userProducts) {
        totalNewMatches += await this.findProductMatches(product)
      }
      console.log(`🎯 Found ${totalNewMatches} new matches for user ${userId}`)
      return { newMatches: totalNewMatches }
    } catch (error) {
      console.error(`❌ Error finding matches for user ${userId}:`, error)
      throw error
    }
  }

  private async findProductMatches(product: Product): Promise<number> {
    console.log(`🔍 Finding matches for product: ${product.name}`)
    try {
      const potentialRecalls = await this.fetchPotentialRecalls(product)
      console.log(`📊 Found ${potentialRecalls.length} potential recalls for "${product.name}"`)
      let newMatches = 0
      for (const recall of potentialRecalls) {
        const existingMatch = await sql`
          SELECT id FROM matched_recalls WHERE product_id = ${product.id} AND recall_id = ${recall.id}
        `
        if (existingMatch.length > 0) continue

        const matchType = this.getMatchType(product, recall)
        if (matchType) {
          await this.saveMatch(product.id, recall.id, matchType.type, matchType.score)
          newMatches++
          console.log(`✅ Created new match: ${product.name} <-> ${recall.title} (Type: ${matchType.type})`)
        }
      }
      return newMatches
    } catch (error) {
      console.error(`❌ Error finding matches for product ${product.name}:`, error)
      return 0
    }
  }

  private getMatchType(product: Product, recall: Recall): { type: string; score: number } | null {
    if (this.matchByExactUPC(product, recall)) return MATCH_TYPES.EXACT_UPC
    if (this.matchByUPCSubstring(product, recall)) return MATCH_TYPES.UPC_SUBSTRING
    if (this.matchByNameKeyword(product, recall)) return MATCH_TYPES.NAME_KEYWORD
    if (this.matchByBrand(product, recall)) return MATCH_TYPES.BRAND
    return null
  }

  private async fetchPotentialRecalls(product: Product): Promise<Recall[]> {
    const searchConditions = []
    if (product.upc) {
      searchConditions.push(`'${product.upc}' = ANY(upc_codes)`)
    }
    if (product.brand) {
      searchConditions.push(`'${product.brand.toLowerCase()}' = ANY(ARRAY(SELECT LOWER(unnest(brand_keywords))))`)
    }
    const nameKeywords = this.extractKeywords(product.normalized_name)
    if (nameKeywords.length > 0) {
      const keywordConditions = nameKeywords.map(
        (keyword) => `'${keyword.toLowerCase()}' = ANY(ARRAY(SELECT LOWER(unnest(product_keywords))))`,
      )
      searchConditions.push(`(${keywordConditions.join(" OR ")})`)
    }

    if (searchConditions.length === 0) return []

    return await sql<Recall[]>`
      SELECT id, title, description, product_keywords, brand_keywords, upc_codes
      FROM recalls
      WHERE (${sql.unsafe(searchConditions.join(" OR "))})
      AND recall_date >= NOW() - INTERVAL '2 years'
      ORDER BY recall_date DESC
    `
  }

  private matchByExactUPC(product: Product, recall: Recall): boolean {
    return !!(product.upc && recall.upc_codes?.includes(product.upc))
  }

  private matchByUPCSubstring(product: Product, recall: Recall): boolean {
    if (!product.upc) return false
    const upc = product.upc
    if (recall.product_description?.includes(upc)) return true
    if (recall.title?.includes(upc)) return true
    if (recall.product_keywords?.some((keyword) => keyword.includes(upc))) return true
    return false
  }

  private matchByNameKeyword(product: Product, recall: Recall): boolean {
    const productNameKeywords = new Set(this.extractKeywords(product.normalized_name))
    if (productNameKeywords.size === 0) return false
    const recallKeywords = new Set(recall.product_keywords?.map((k) => k.toLowerCase()) || [])
    if (recallKeywords.size === 0) return false
    const intersection = new Set([...productNameKeywords].filter((x) => recallKeywords.has(x)))
    return intersection.size >= 2
  }

  private matchByBrand(product: Product, recall: Recall): boolean {
    if (!product.brand) return false
    const productBrand = product.brand.toLowerCase()
    return recall.brand_keywords?.some((brand) => brand.toLowerCase() === productBrand) || false
  }

  private extractKeywords(text: string | null | undefined): string[] {
    if (!text) return []
    const stopWords = new Set(["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"])
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  }

  private async saveMatch(productId: string, recallId: string, matchType: string, confidenceScore: number) {
    await sql`
      INSERT INTO matched_recalls (product_id, recall_id, match_type, confidence_score, created_at)
      VALUES (${productId}, ${recallId}, ${matchType}, ${confidenceScore}, NOW())
    `
  }
}
