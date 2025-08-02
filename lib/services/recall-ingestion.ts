export class RecallIngestionService {
  private static instance: RecallIngestionService
  private readonly baseUrls = {
    fda_food: "https://api.fda.gov/food/enforcement.json",
    fda_drug: "https://api.fda.gov/drug/enforcement.json",
    fda_device: "https://api.fda.gov/device/enforcement.json",
    usda: "https://www.fsis.usda.gov/fsis/api/recall",
    cpsc: "https://www.cpsc.gov/Newsroom/News-Releases/RSS",
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
      fda_food: { success: 0, errors: 0 },
      fda_drug: { success: 0, errors: 0 },
      fda_device: { success: 0, errors: 0 },
      usda: { success: 0, errors: 0 },
      cpsc: { success: 0, errors: 0 },
      nhtsa: { success: 0, errors: 0 },
    }

    // Sync FDA Food recalls
    try {
      const fdaFoodResult = await this.syncFDARecalls("food")
      results.fda_food = fdaFoodResult
    } catch (error) {
      console.error("FDA Food sync failed:", error)
      results.fda_food.errors = 1
    }

    // Sync FDA Drug recalls
    try {
      const fdaDrugResult = await this.syncFDARecalls("drug")
      results.fda_drug = fdaDrugResult
    } catch (error) {
      console.error("FDA Drug sync failed:", error)
      results.fda_drug.errors = 1
    }

    // Sync FDA Device recalls
    try {
      const fdaDeviceResult = await this.syncFDARecalls("device")
      results.fda_device = fdaDeviceResult
    } catch (error) {
      console.error("FDA Device sync failed:", error)
      results.fda_device.errors = 1
    }

    // Sync USDA recalls
    try {
      const usdaResult = await this.syncUSDARecalls()
      results.usda = usdaResult
    } catch (error) {
      console.error("USDA sync failed:", error)
      results.usda.errors = 1
    }

    // Sync CPSC recalls
    try {
      const cpscResult = await this.syncCPSCRecalls()
      results.cpsc = cpscResult
    } catch (error) {
      console.error("CPSC sync failed:", error)
      results.cpsc.errors = 1
    }

    // Sync NHTSA recalls
    try {
      const nhtsaResult = await this.syncNHTSARecalls()
      results.nhtsa = nhtsaResult
    } catch (error) {
      console.error("NHTSA sync failed:", error)
      results.nhtsa.errors = 1
    }

    console.log("✅ Recall sync completed:", results)
    return results
  }

  private async syncFDARecalls(type: "food" | "drug" | "device") {
    const url = `https://api.fda.gov/${type}/enforcement.json?limit=100`

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        throw new Error(`FDA ${type} API returned ${response.status}`)
      }

      const data = await response.json()
      const recalls = data.results || []

      let successCount = 0
      let errorCount = 0

      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.recall_number || recall.id,
            source: `fda_${type}`,
            title: recall.product_description || recall.reason_for_recall,
            description: recall.reason_for_recall,
            date_published: new Date(recall.report_date || recall.recall_initiation_date),
            severity: this.mapFDASeverity(recall.classification),
            product_keywords: this.extractProductKeywords(recall.product_description),
            brand_keywords: this.extractBrandKeywords(recall.product_description),
            upc_codes: this.extractUPCs(recall.product_description),
            raw_data: recall,
          })
          successCount++
        } catch (error) {
          console.error(`Failed to upsert FDA ${type} recall:`, error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error(`FDA ${type} sync failed:`, error)
      return { success: 0, errors: 1 }
    }
  }

  private async syncUSDARecalls() {
    try {
      const response = await fetch(this.baseUrls.usda, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        throw new Error(`USDA API returned ${response.status}`)
      }

      const recalls = await response.json()
      let successCount = 0
      let errorCount = 0

      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.recallId || recall.id,
            source: "usda",
            title: recall.productName || recall.title,
            description: recall.reason || recall.description,
            date_published: new Date(recall.recallDate),
            severity: "high", // USDA recalls are typically high severity
            product_keywords: this.extractProductKeywords(recall.productName),
            brand_keywords: this.extractBrandKeywords(recall.productName),
            upc_codes: this.extractUPCs(recall.productName),
            raw_data: recall,
          })
          successCount++
        } catch (error) {
          console.error("Failed to upsert USDA recall:", error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error("USDA sync failed:", error)
      return { success: 0, errors: 1 }
    }
  }

  private async syncCPSCRecalls() {
    // CPSC uses RSS, so we'll need to parse XML
    try {
      const response = await fetch(this.baseUrls.cpsc, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        throw new Error(`CPSC RSS returned ${response.status}`)
      }

      const xmlText = await response.text()
      // Simple XML parsing for RSS items
      const items = this.parseRSSItems(xmlText)

      let successCount = 0
      let errorCount = 0

      for (const item of items) {
        try {
          if (item.title.toLowerCase().includes("recall")) {
            await this.upsertRecall({
              external_id: item.guid || item.link,
              source: "cpsc",
              title: item.title,
              description: item.description,
              date_published: new Date(item.pubDate),
              severity: "medium",
              product_keywords: this.extractProductKeywords(item.title + " " + item.description),
              brand_keywords: this.extractBrandKeywords(item.title + " " + item.description),
              upc_codes: [],
              raw_data: item,
            })
            successCount++
          }
        } catch (error) {
          console.error("Failed to upsert CPSC recall:", error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error("CPSC sync failed:", error)
      return { success: 0, errors: 1 }
    }
  }

  private async syncNHTSARecalls() {
    const currentYear = new Date().getFullYear()
    const url = `${this.baseUrls.nhtsa}?modelYear=${currentYear}`

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        throw new Error(`NHTSA API returned ${response.status}`)
      }

      const data = await response.json()
      const recalls = data.results || []

      let successCount = 0
      let errorCount = 0

      for (const recall of recalls) {
        try {
          await this.upsertRecall({
            external_id: recall.NHTSACampaignNumber || recall.id,
            source: "nhtsa",
            title: `${recall.Make} ${recall.Model} ${recall.ModelYear} - ${recall.Component}`,
            description: recall.Summary,
            date_published: new Date(recall.ReportReceivedDate),
            severity: "high",
            product_keywords: [recall.Make, recall.Model, recall.Component].filter(Boolean),
            brand_keywords: [recall.Make].filter(Boolean),
            upc_codes: [],
            raw_data: recall,
          })
          successCount++
        } catch (error) {
          console.error("Failed to upsert NHTSA recall:", error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error("NHTSA sync failed:", error)
      return { success: 0, errors: 1 }
    }
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
      ON CONFLICT (external_id, source) 
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

  private mapFDASeverity(classification: string): string {
    if (!classification) return "medium"

    switch (classification.toLowerCase()) {
      case "class i":
        return "high"
      case "class ii":
        return "medium"
      case "class iii":
        return "low"
      default:
        return "medium"
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
      .slice(0, 10) // Limit to 10 keywords

    return [...new Set(keywords)] // Remove duplicates
  }

  private extractBrandKeywords(text: string): string[] {
    if (!text) return []

    // Simple brand extraction - look for capitalized words
    const brands = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []

    return [...new Set(brands.slice(0, 5))] // Limit to 5 brands
  }

  private extractUPCs(text: string): string[] {
    if (!text) return []

    // Extract UPC codes (12 digits)
    const upcs = text.match(/\b\d{12}\b/g) || []

    return [...new Set(upcs)]
  }

  private parseRSSItems(xmlText: string): any[] {
    const items: any[] = []

    // Simple regex-based XML parsing for RSS items
    const itemRegex = /<item>(.*?)<\/item>/gs
    const matches = xmlText.match(itemRegex) || []

    for (const match of matches) {
      const item: any = {}

      const titleMatch = match.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
      if (titleMatch) item.title = titleMatch[1]

      const descMatch = match.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)
      if (descMatch) item.description = descMatch[1]

      const linkMatch = match.match(/<link>(.*?)<\/link>/)
      if (linkMatch) item.link = linkMatch[1]

      const guidMatch = match.match(/<guid.*?>(.*?)<\/guid>/)
      if (guidMatch) item.guid = guidMatch[1]

      const pubDateMatch = match.match(/<pubDate>(.*?)<\/pubDate>/)
      if (pubDateMatch) item.pubDate = pubDateMatch[1]

      if (item.title) items.push(item)
    }

    return items
  }
}
