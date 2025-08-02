import { sql } from "@/lib/database"

interface RecallData {
  external_id: string
  title: string
  description: string
  date_published: string
  url: string
  product_keywords: string[]
  brand_keywords: string[]
  upc_codes: string[]
  source: string
  severity?: string
  product_type?: string
}

export class RecallIngestionService {
  private static instance: RecallIngestionService

  static getInstance(): RecallIngestionService {
    if (!RecallIngestionService.instance) {
      RecallIngestionService.instance = new RecallIngestionService()
    }
    return RecallIngestionService.instance
  }

  async syncAllRecalls() {
    console.log("🔄 Starting recall sync from all sources...")

    const results = {
      fda: { success: false, count: 0, error: null as string | null },
      cpsc: { success: false, count: 0, error: null as string | null },
      usda: { success: false, count: 0, error: null as string | null },
    }

    // Sync FDA recalls
    try {
      const fdaCount = await this.syncFDARecalls()
      results.fda = { success: true, count: fdaCount, error: null }
    } catch (error) {
      results.fda.error = error instanceof Error ? error.message : "Unknown error"
      console.error("FDA sync failed:", error)
    }

    // Sync CPSC recalls
    try {
      const cpscCount = await this.syncCPSCRecalls()
      results.cpsc = { success: true, count: cpscCount, error: null }
    } catch (error) {
      results.cpsc.error = error instanceof Error ? error.message : "Unknown error"
      console.error("CPSC sync failed:", error)
    }

    // Sync USDA recalls
    try {
      const usdaCount = await this.syncUSDARecalls()
      results.usda = { success: true, count: usdaCount, error: null }
    } catch (error) {
      results.usda.error = error instanceof Error ? error.message : "Unknown error"
      console.error("USDA sync failed:", error)
    }

    return results
  }

  private async syncFDARecalls(): Promise<number> {
    console.log("📡 Syncing FDA recalls...")

    // FDA API endpoint for food recalls
    const fdaUrl = "https://api.fda.gov/food/enforcement.json?limit=100"

    try {
      const response = await fetch(fdaUrl)
      if (!response.ok) {
        throw new Error(`FDA API error: ${response.status}`)
      }

      const data = await response.json()
      const recalls = data.results || []

      let processedCount = 0
      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.recall_number || `fda-${recall.event_id}`,
            title: recall.product_description || "FDA Food Recall",
            description: recall.reason_for_recall || "",
            date_published: recall.report_date || new Date().toISOString(),
            url: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
            product_keywords: this.extractProductKeywords(recall.product_description || ""),
            brand_keywords: this.extractBrandKeywords(recall.recalling_firm || ""),
            upc_codes: [],
            source: "FDA",
            severity: recall.classification,
            product_type: "food",
          })
          processedCount++
        } catch (error) {
          console.error(`Failed to process FDA recall ${recall.recall_number}:`, error)
        }
      }

      console.log(`✅ Processed ${processedCount} FDA recalls`)
      return processedCount
    } catch (error) {
      console.error("FDA API error:", error)
      throw error
    }
  }

  private async syncCPSCRecalls(): Promise<number> {
    console.log("📡 Syncing CPSC recalls...")

    // CPSC API endpoint
    const cpscUrl = "https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2024-01-01"

    try {
      const response = await fetch(cpscUrl)
      if (!response.ok) {
        throw new Error(`CPSC API error: ${response.status}`)
      }

      const recalls = await response.json()

      let processedCount = 0
      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.RecallNumber || `cpsc-${recall.RecallID}`,
            title: recall.ProductName || "CPSC Product Recall",
            description: recall.Description || "",
            date_published: recall.RecallDate || new Date().toISOString(),
            url: recall.URL || "https://www.cpsc.gov/Recalls",
            product_keywords: this.extractProductKeywords(recall.ProductName || ""),
            brand_keywords: this.extractBrandKeywords(recall.Manufacturer || ""),
            upc_codes: recall.UPCs ? [recall.UPCs] : [],
            source: "CPSC",
            severity: recall.HazardLevel,
            product_type: "consumer_product",
          })
          processedCount++
        } catch (error) {
          console.error(`Failed to process CPSC recall ${recall.RecallNumber}:`, error)
        }
      }

      console.log(`✅ Processed ${processedCount} CPSC recalls`)
      return processedCount
    } catch (error) {
      console.error("CPSC API error:", error)
      throw error
    }
  }

  private async syncUSDARecalls(): Promise<number> {
    console.log("📡 Syncing USDA recalls...")

    // USDA FSIS API endpoint
    const usdaUrl = "https://www.fsis.usda.gov/fsis/api/recall"

    try {
      const response = await fetch(usdaUrl)
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`)
      }

      const data = await response.json()
      const recalls = data.results || []

      let processedCount = 0
      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.recall_case_number || `usda-${recall.id}`,
            title: recall.product_name || "USDA Food Recall",
            description: recall.summary || "",
            date_published: recall.recall_notification_date || new Date().toISOString(),
            url: recall.press_release_url || "https://www.fsis.usda.gov/recalls",
            product_keywords: this.extractProductKeywords(recall.product_name || ""),
            brand_keywords: this.extractBrandKeywords(recall.establishment_name || ""),
            upc_codes: [],
            source: "USDA",
            severity: recall.health_hazard_evaluation,
            product_type: "food",
          })
          processedCount++
        } catch (error) {
          console.error(`Failed to process USDA recall ${recall.recall_case_number}:`, error)
        }
      }

      console.log(`✅ Processed ${processedCount} USDA recalls`)
      return processedCount
    } catch (error) {
      console.error("USDA API error:", error)
      throw error
    }
  }

  private async upsertRecall(recallData: RecallData): Promise<void> {
    try {
      await sql`
        INSERT INTO recalls (
          external_id, title, description, date_published, url,
          product_keywords, brand_keywords, upc_codes, source,
          severity, product_type, created_at, updated_at
        ) VALUES (
          ${recallData.external_id},
          ${recallData.title},
          ${recallData.description},
          ${recallData.date_published},
          ${recallData.url},
          ${JSON.stringify(recallData.product_keywords)},
          ${JSON.stringify(recallData.brand_keywords)},
          ${JSON.stringify(recallData.upc_codes)},
          ${recallData.source},
          ${recallData.severity || null},
          ${recallData.product_type || null},
          NOW(),
          NOW()
        )
        ON CONFLICT (external_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          date_published = EXCLUDED.date_published,
          url = EXCLUDED.url,
          product_keywords = EXCLUDED.product_keywords,
          brand_keywords = EXCLUDED.brand_keywords,
          upc_codes = EXCLUDED.upc_codes,
          severity = EXCLUDED.severity,
          product_type = EXCLUDED.product_type,
          updated_at = NOW()
      `
    } catch (error) {
      console.error("Database upsert error:", error)
      throw error
    }
  }

  private extractProductKeywords(text: string): string[] {
    if (!text) return []

    // Extract meaningful product keywords
    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !["the", "and", "for", "with", "from", "that", "this"].includes(word))

    return [...new Set(keywords)]
  }

  private extractBrandKeywords(text: string): string[] {
    if (!text) return []

    // Extract brand names and company keywords
    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1)
      .filter((word) => !["inc", "llc", "corp", "company", "co", "ltd"].includes(word))

    return [...new Set(keywords)]
  }
}
