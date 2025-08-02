export class RecallIngestionService {
  private static instance: RecallIngestionService
  private readonly baseUrls = {
    fda: "https://api.fda.gov/food/enforcement.json",
    cpsc: "https://www.saferproducts.gov/RestWebServices/Recall",
    nhtsa: "https://api.nhtsa.gov/recalls/recallsByVehicle",
  }

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
      nhtsa: { success: false, count: 0, error: null as string | null },
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

    // Sync NHTSA recalls
    try {
      const nhtsaCount = await this.syncNHTSARecalls()
      results.nhtsa = { success: true, count: nhtsaCount, error: null }
    } catch (error) {
      results.nhtsa.error = error instanceof Error ? error.message : "Unknown error"
      console.error("NHTSA sync failed:", error)
    }

    return results
  }

  private async syncFDARecalls(): Promise<number> {
    console.log("📡 Syncing FDA recalls...")

    // Get recent recalls (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateFilter = thirtyDaysAgo.toISOString().split("T")[0].replace(/-/g, "")

    const url = `${this.baseUrls.fda}?search=report_date:[${dateFilter}+TO+*]&limit=100`

    const response = await fetch(url)
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
          source: "FDA",
          title: recall.product_description || "FDA Food Recall",
          description: recall.reason_for_recall || "",
          date_published: this.safeDate(recall.report_date),
          severity: this.mapFDASeverity(recall.classification),
          product_keywords: this.extractProductKeywords(recall.product_description || ""),
          brand_keywords: this.extractBrandKeywords(recall.recalling_firm || ""),
          upc_codes: [],
          raw_data: recall,
        })
        processedCount++
      } catch (error) {
        console.error(`Failed to process FDA recall ${recall.recall_number}:`, error)
      }
    }

    console.log(`✅ Processed ${processedCount} FDA recalls`)
    return processedCount
  }

  private async syncCPSCRecalls(): Promise<number> {
    console.log("📡 Syncing CPSC recalls...")

    // CPSC API endpoint for recent recalls
    const url = `${this.baseUrls.cpsc}?format=json&limit=100`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`CPSC API error: ${response.status}`)
    }

    const data = await response.json()
    const recalls = Array.isArray(data) ? data : [data]

    let processedCount = 0
    for (const recall of recalls) {
      try {
        await this.upsertRecall({
          external_id: recall.RecallID || `cpsc-${recall.RecallNumber}`,
          source: "CPSC",
          title: recall.ProductName || "CPSC Product Recall",
          description: recall.Description || recall.Hazard || "",
          date_published: this.safeDate(recall.RecallDate),
          severity: this.mapCPSCSeverity(recall.Hazard),
          product_keywords: this.extractProductKeywords(recall.ProductName || ""),
          brand_keywords: this.extractBrandKeywords(recall.Manufacturer || ""),
          upc_codes: recall.UPC ? [recall.UPC] : [],
          raw_data: recall,
        })
        processedCount++
      } catch (error) {
        console.error(`Failed to process CPSC recall ${recall.RecallID}:`, error)
      }
    }

    console.log(`✅ Processed ${processedCount} CPSC recalls`)
    return processedCount
  }

  private async syncNHTSARecalls(): Promise<number> {
    console.log("📡 Syncing NHTSA recalls...")

    // NHTSA API for recent recalls
    const currentYear = new Date().getFullYear()
    const url = `${this.baseUrls.nhtsa}?modelYear=${currentYear}&format=json`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()
    const recalls = data.results || []

    let processedCount = 0
    for (const recall of recalls) {
      try {
        await this.upsertRecall({
          external_id: recall.NHTSACampaignNumber || `nhtsa-${recall.NHTSAActionNumber}`,
          source: "NHTSA",
          title: `${recall.Make} ${recall.Model} Recall`,
          description: recall.Summary || recall.Defect || "",
          date_published: this.safeDate(recall.ReportReceivedDate),
          severity: this.mapNHTSASeverity(recall.DefectSeverity),
          product_keywords: this.extractProductKeywords(`${recall.Make} ${recall.Model} ${recall.Component}`),
          brand_keywords: this.extractBrandKeywords(recall.Make || ""),
          upc_codes: [],
          raw_data: recall,
        })
        processedCount++
      } catch (error) {
        console.error(`Failed to process NHTSA recall ${recall.NHTSACampaignNumber}:`, error)
      }
    }

    console.log(`✅ Processed ${processedCount} NHTSA recalls`)
    return processedCount
  }

  private async upsertRecall(recallData: {
    external_id: string
    source: string
    title: string
    description: string
    date_published: Date
    severity: string
    product_keywords: string[]
    brand_keywords: string[]
    upc_codes: string[]
    raw_data: any
  }) {
    const { sql } = await import("@/lib/database")

    await sql`
      INSERT INTO recalls (
        external_id, source, title, description, date_published, 
        severity, product_keywords, brand_keywords, upc_codes, raw_data
      ) VALUES (
        ${recallData.external_id},
        ${recallData.source},
        ${recallData.title},
        ${recallData.description},
        ${recallData.date_published},
        ${recallData.severity},
        ${JSON.stringify(recallData.product_keywords)},
        ${JSON.stringify(recallData.brand_keywords)},
        ${JSON.stringify(recallData.upc_codes)},
        ${JSON.stringify(recallData.raw_data)}
      )
      ON CONFLICT (external_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        severity = EXCLUDED.severity,
        product_keywords = EXCLUDED.product_keywords,
        brand_keywords = EXCLUDED.brand_keywords,
        upc_codes = EXCLUDED.upc_codes,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
    `
  }

  private safeDate(input: string | undefined | null): Date {
    const parsed = new Date(input ?? "")
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  private mapFDASeverity(classification: string): string {
    if (!classification) return "medium"
    const cls = classification.toLowerCase()
    if (cls.includes("class i")) return "high"
    if (cls.includes("class ii")) return "medium"
    if (cls.includes("class iii")) return "low"
    return "medium"
  }

  private mapCPSCSeverity(hazard: string): string {
    if (!hazard) return "medium"
    const h = hazard.toLowerCase()
    if (h.includes("death") || h.includes("serious injury")) return "high"
    if (h.includes("injury") || h.includes("burn")) return "medium"
    return "low"
  }

  private mapNHTSASeverity(severity: string): string {
    if (!severity) return "medium"
    const s = severity.toLowerCase()
    if (s.includes("high") || s.includes("critical")) return "high"
    if (s.includes("medium") || s.includes("moderate")) return "medium"
    return "low"
  }

  private extractProductKeywords(text: string): string[] {
    if (!text) return []

    // Remove common stop words and extract meaningful product terms
    const stopWords = new Set(["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10) // Limit to 10 keywords
  }

  private extractBrandKeywords(text: string): string[] {
    if (!text) return []

    // Extract brand names (usually proper nouns)
    return text
      .split(/[,\s]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 1)
      .slice(0, 5) // Limit to 5 brand keywords
  }
}
