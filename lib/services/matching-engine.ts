import { sql } from "@/lib/database"

export class MatchingEngine {
  private static instance: MatchingEngine

  static getInstance(): MatchingEngine {
    if (!MatchingEngine.instance) {
      MatchingEngine.instance = new MatchingEngine()
    }
    return MatchingEngine.instance
  }

  async findMatches(userId: string): Promise<{ newMatches: number }> {
    console.log(`🔍 Finding matches for user: ${userId}`)

    try {
      // Get user's products
      const userProducts = await sql`
        SELECT id, name, brand, upc_code, keywords
        FROM products 
        WHERE user_id = ${userId}
      `

      if (userProducts.length === 0) {
        console.log(`📦 No products found for user ${userId}`)
        return { newMatches: 0 }
      }

      console.log(`📦 Found ${userProducts.length} products for user ${userId}`)

      let totalNewMatches = 0

      for (const product of userProducts) {
        const matches = await this.findProductMatches(product)
        totalNewMatches += matches
      }

      console.log(`🎯 Found ${totalNewMatches} new matches for user ${userId}`)
      return { newMatches: totalNewMatches }
    } catch (error) {
      console.error(`❌ Error finding matches for user ${userId}:`, error)
      throw error
    }
  }

  private async findProductMatches(product: any): Promise<number> {
    console.log(`🔍 Finding matches for product: ${product.name}`)

    try {
      // Build search conditions
      const searchConditions = []
      const searchParams = []

      // Search by UPC if available
      if (product.upc_code) {
        searchConditions.push(`${product.upc_code} = ANY(upc_codes)`)
      }

      // Search by brand if available
      if (product.brand) {
        searchConditions.push(`${product.brand.toLowerCase()} = ANY(ARRAY(SELECT LOWER(unnest(brand_keywords))))`)
      }

      // Search by product name keywords
      if (product.name) {
        const nameKeywords = this.extractKeywords(product.name)
        if (nameKeywords.length > 0) {
          const keywordConditions = nameKeywords.map(
            (keyword) => `${keyword.toLowerCase()} = ANY(ARRAY(SELECT LOWER(unnest(product_keywords))))`,
          )
          searchConditions.push(`(${keywordConditions.join(" OR ")})`)
        }
      }

      if (searchConditions.length === 0) {
        console.log(`⚠️ No search conditions for product: ${product.name}`)
        return 0
      }

      // Find matching recalls
      const matchingRecalls = await sql`
        SELECT id, external_id, source, title, description, severity, date_published
        FROM recalls 
        WHERE ${sql.unsafe(searchConditions.join(" OR "))}
        AND date_published >= NOW() - INTERVAL '2 years'
        ORDER BY date_published DESC
      `

      console.log(`📊 Found ${matchingRecalls.length} potential matches for product: ${product.name}`)

      let newMatches = 0

      for (const recall of matchingRecalls) {
        // Check if this match already exists
        const existingMatch = await sql`
          SELECT id FROM product_recall_matches 
          WHERE product_id = ${product.id} AND recall_id = ${recall.id}
        `

        if (existingMatch.length === 0) {
          // Create new match
          await sql`
            INSERT INTO product_recall_matches (product_id, recall_id, match_confidence, created_at)
            VALUES (${product.id}, ${recall.id}, ${this.calculateConfidence(product, recall)}, NOW())
          `
          newMatches++
          console.log(`✅ Created new match: ${product.name} <-> ${recall.title}`)
        }
      }

      return newMatches
    } catch (error) {
      console.error(`❌ Error finding matches for product ${product.name}:`, error)
      return 0
    }
  }

  private extractKeywords(text: string): string[] {
    if (!text) return []

    const stopWords = new Set(["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10)
  }

  private calculateConfidence(product: any, recall: any): number {
    let confidence = 0.5 // Base confidence

    // Boost confidence for UPC matches
    if (product.upc_code && recall.upc_codes?.includes(product.upc_code)) {
      confidence += 0.4
    }

    // Boost confidence for brand matches
    if (
      product.brand &&
      recall.brand_keywords?.some((brand: string) => brand.toLowerCase().includes(product.brand.toLowerCase()))
    ) {
      confidence += 0.2
    }

    // Boost confidence for keyword matches
    const productKeywords = this.extractKeywords(product.name)
    const matchingKeywords = productKeywords.filter((keyword) =>
      recall.product_keywords?.some((recallKeyword: string) =>
        recallKeyword.toLowerCase().includes(keyword.toLowerCase()),
      ),
    )

    if (matchingKeywords.length > 0) {
      confidence += (matchingKeywords.length / productKeywords.length) * 0.3
    }

    return Math.min(confidence, 1.0) // Cap at 1.0
  }
}
