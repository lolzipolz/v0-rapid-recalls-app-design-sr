import { sql } from "../database"
import type { Product, Recall } from "../database"

export class MatchingEngine {
  private static instance: MatchingEngine

  static getInstance(): MatchingEngine {
    if (!MatchingEngine.instance) {
      MatchingEngine.instance = new MatchingEngine()
    }
    return MatchingEngine.instance
  }

  async findMatches(userId: string): Promise<MatchResult> {
    const result: MatchResult = {
      totalProducts: 0,
      totalRecalls: 0,
      newMatches: 0,
      processingTime: 0,
    }

    const startTime = Date.now()

    try {
      // Get user's products
      const products = await sql<Product[]>`
        SELECT * FROM products WHERE user_id = ${userId}
      `

      // Get recent recalls (last 2 years)
      const recalls = await sql<Recall[]>`
        SELECT * FROM recalls 
        WHERE recall_date >= NOW() - INTERVAL '2 years'
        ORDER BY recall_date DESC
      `

      result.totalProducts = products.length
      result.totalRecalls = recalls.length

      console.log(`Processing ${products.length} products against ${recalls.length} recalls for user ${userId}`)

      for (const product of products) {
        for (const recall of recalls) {
          const match = await this.calculateMatch(product, recall)
          if (match && match.confidence_score >= 0.7) {
            const created = await this.createMatch(userId, product.id, recall.id, match)
            if (created) result.newMatches++
          }
        }
      }

      result.processingTime = Date.now() - startTime
      console.log(`Matching completed: ${result.newMatches} new matches found in ${result.processingTime}ms`)

      return result
    } catch (error) {
      console.error("Matching failed:", error)
      throw error
    }
  }

  private async calculateMatch(product: Product, recall: Recall): Promise<MatchResult | null> {
    // 1. Exact UPC match (100% confidence)
    if (product.upc && recall.upcs.length > 0) {
      const normalizedProductUPC = this.normalizeUPC(product.upc)
      const hasUPCMatch = recall.upcs.some((recallUPC) => {
        const normalizedRecallUPC = this.normalizeUPC(recallUPC)
        return normalizedProductUPC === normalizedRecallUPC
      })

      if (hasUPCMatch) {
        console.log(`UPC match found: ${product.name} <-> ${recall.title}`)
        return {
          match_type: "upc_exact",
          confidence_score: 1.0,
        }
      }
    }

    // 2. Brand + Title fuzzy match
    if (product.brand && recall.brands.length > 0) {
      const brandMatch = recall.brands.some(
        (recallBrand) => this.fuzzyMatch(product.brand!.toLowerCase(), recallBrand.toLowerCase()) > 0.8,
      )

      if (brandMatch) {
        const titleScore = this.calculateTitleMatch(product.normalized_name || product.name, recall.product_keywords)
        if (titleScore > 0.6) {
          const finalScore = Math.min(0.95, (titleScore + 0.8) / 2)
          console.log(`Brand+Title match: ${product.name} <-> ${recall.title} (${finalScore})`)
          return {
            match_type: "brand_fuzzy",
            confidence_score: finalScore,
          }
        }
      }
    }

    // 3. Title-only fuzzy match (higher threshold)
    const titleScore = this.calculateTitleMatch(product.normalized_name || product.name, recall.product_keywords)
    if (titleScore > 0.75) {
      console.log(`Title match: ${product.name} <-> ${recall.title} (${titleScore})`)
      return {
        match_type: "title_fuzzy",
        confidence_score: titleScore,
      }
    }

    return null
  }

  private normalizeUPC(upc: string): string {
    // Remove all non-digits and pad to standard length
    const digits = upc.replace(/\D/g, "")
    if (digits.length === 12) return digits // UPC-A
    if (digits.length === 13) return digits // EAN-13
    if (digits.length === 8) return digits.padStart(12, "0") // UPC-E to UPC-A
    return digits
  }

  private calculateTitleMatch(productName: string, recallKeywords: string[]): number {
    const productWords = this.extractSignificantWords(productName.toLowerCase())
    let totalScore = 0
    let matchCount = 0

    for (const productWord of productWords) {
      let bestScore = 0
      for (const keyword of recallKeywords) {
        const score = this.fuzzyMatch(productWord, keyword.toLowerCase())
        bestScore = Math.max(bestScore, score)
      }

      if (bestScore > 0.7) {
        totalScore += bestScore
        matchCount++
      }
    }

    // Bonus for multiple word matches
    const baseScore = matchCount > 0 ? totalScore / matchCount : 0
    const matchRatio = matchCount / Math.max(productWords.length, 1)
    return Math.min(0.95, baseScore * (0.7 + 0.3 * matchRatio))
  }

  private extractSignificantWords(text: string): string[] {
    const stopWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "gen",
      "generation",
      "new",
      "old",
      "pro",
      "plus",
      "max",
      "mini",
      "air",
    ])

    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10) // Limit to most important words
  }

  private fuzzyMatch(str1: string, str2: string): number {
    // Use Jaro-Winkler for better fuzzy matching
    const jaroScore = this.jaroSimilarity(str1, str2)

    // Boost score for common prefixes (Winkler modification)
    const prefixLength = this.getCommonPrefixLength(str1, str2)
    const winklerBoost = prefixLength > 0 ? 0.1 * prefixLength * (1 - jaroScore) : 0

    return Math.min(1, jaroScore + winklerBoost)
  }

  private jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1
    const str1Matches = new Array(str1.length).fill(false)
    const str2Matches = new Array(str2.length).fill(false)

    let matches = 0
    let transpositions = 0

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow)
      const end = Math.min(i + matchWindow + 1, str2.length)

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue
        str1Matches[i] = true
        str2Matches[j] = true
        matches++
        break
      }
    }

    if (matches === 0) return 0

    // Count transpositions
    let k = 0
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue
      while (!str2Matches[k]) k++
      if (str1[i] !== str2[k]) transpositions++
      k++
    }

    return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3
  }

  private getCommonPrefixLength(str1: string, str2: string): number {
    let length = 0
    const maxLength = Math.min(4, Math.min(str1.length, str2.length))

    for (let i = 0; i < maxLength; i++) {
      if (str1[i] === str2[i]) length++
      else break
    }

    return length
  }

  private async createMatch(userId: string, productId: string, recallId: string, match: MatchResult): Promise<boolean> {
    try {
      const result = await sql`
        INSERT INTO matched_recalls (user_id, product_id, recall_id, match_type, confidence_score)
        VALUES (${userId}, ${productId}, ${recallId}, ${match.match_type}, ${match.confidence_score})
        ON CONFLICT (product_id, recall_id) DO NOTHING
        RETURNING id
      `
      return result.length > 0
    } catch (error) {
      console.error("Failed to create match:", error)
      return false
    }
  }
}

interface MatchResult {
  match_type?: "upc_exact" | "title_fuzzy" | "brand_fuzzy"
  confidence_score?: number
  totalProducts?: number
  totalRecalls?: number
  newMatches?: number
  processingTime?: number
}
