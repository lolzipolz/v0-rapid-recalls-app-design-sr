import { sql } from "../database"
import type { Recall } from "../database"

export class RecallIngestionService {
  private static instance: RecallIngestionService

  static getInstance(): RecallIngestionService {
    if (!RecallIngestionService.instance) {
      RecallIngestionService.instance = new RecallIngestionService()
    }
    return RecallIngestionService.instance
  }

  async syncAllRecalls(): Promise<SyncResult> {
    console.log("Starting recall sync...")

    const results: SyncResult = {
      fda: { success: 0, errors: 0 },
      usda: { success: 0, errors: 0 },
      cpsc: { success: 0, errors: 0 },
      nhtsa: { success: 0, errors: 0 },
    }

    try {
      // Run all syncs in parallel
      const [fdaResult, usdaResult, cpscResult, nhtsaResult] = await Promise.allSettled([
        this.syncFDARecalls(),
        this.syncUSDARecalls(),
        this.syncCPSCRecalls(),
        this.syncNHTSARecalls(),
      ])

      // Process results
      if (fdaResult.status === "fulfilled") results.fda = fdaResult.value
      else {
        results.fda.errors = 1
        console.error("FDA sync failed:", fdaResult.reason)
      }

      if (usdaResult.status === "fulfilled") results.usda = usdaResult.value
      else {
        results.usda.errors = 1
        console.error("USDA sync failed:", usdaResult.reason)
      }

      if (cpscResult.status === "fulfilled") results.cpsc = cpscResult.value
      else {
        results.cpsc.errors = 1
        console.error("CPSC sync failed:", cpscResult.reason)
      }

      if (nhtsaResult.status === "fulfilled") results.nhtsa = nhtsaResult.value
      else {
        results.nhtsa.errors = 1
        console.error("NHTSA sync failed:", nhtsaResult.reason)
      }

      console.log("Recall sync completed:", results)
      return results
    } catch (error) {
      console.error("Recall sync failed:", error)
      throw error
    }
  }

  private async syncFDARecalls(): Promise<AgencyResult> {
    const result: AgencyResult = { success: 0, errors: 0 }

    try {
      // FDA Food Recalls
      const foodResponse = await fetch("https://api.fda.gov/food/enforcement.json?limit=100")
      const foodData = await foodResponse.json()

      for (const recall of foodData.results || []) {
        try {
          await this.upsertRecall({
            agency: "FDA",
            recall_number: recall.recall_number || `FDA-FOOD-${Date.now()}-${Math.random()}`,
            title: recall.product_description || "FDA Food Recall",
            description: recall.reason_for_recall,
            recall_date: this.parseDate(recall.recall_initiation_date),
            link: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
            severity: this.mapFDASeverity(recall.classification),
            product_keywords: this.extractKeywords(recall.product_description),
            upcs: this.extractUPCs(recall.product_description),
            brands: this.extractBrands(recall.product_description),
            raw_data: recall,
          })
          result.success++
        } catch (error) {
          result.errors++
          console.error("Failed to process FDA food recall:", error)
        }
      }

      // FDA Drug Recalls
      const drugResponse = await fetch("https://api.fda.gov/drug/enforcement.json?limit=50")
      const drugData = await drugResponse.json()

      for (const recall of drugData.results || []) {
        try {
          await this.upsertRecall({
            agency: "FDA",
            recall_number: recall.recall_number || `FDA-DRUG-${Date.now()}-${Math.random()}`,
            title: recall.product_description || "FDA Drug Recall",
            description: recall.reason_for_recall,
            recall_date: this.parseDate(recall.recall_initiation_date),
            link: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
            severity: this.mapFDASeverity(recall.classification),
            product_keywords: this.extractKeywords(recall.product_description),
            upcs: this.extractUPCs(recall.product_description),
            brands: this.extractBrands(recall.product_description),
            raw_data: recall,
          })
          result.success++
        } catch (error) {
          result.errors++
          console.error("Failed to process FDA drug recall:", error)
        }
      }
    } catch (error) {
      console.error("FDA recall sync failed:", error)
      result.errors++
    }

    return result
  }

  private async syncUSDARecalls(): Promise<AgencyResult> {
    const result: AgencyResult = { success: 0, errors: 0 }

    try {
      const response = await fetch("https://www.fsis.usda.gov/fsis/api/recall", {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        throw new Error(`USDA API returned ${response.status}`)
      }

      const data = await response.json()

      for (const recall of data || []) {
        try {
          await this.upsertRecall({
            agency: "USDA",
            recall_number: recall.recallNumber || `USDA-${Date.now()}-${Math.random()}`,
            title: recall.productName || "USDA Recall",
            description: recall.problemDescription || recall.healthHazard,
            recall_date: this.parseDate(recall.recallDate),
            link: recall.pressRelease || "https://www.fsis.usda.gov/recalls",
            severity: "high", // USDA recalls are typically serious
            product_keywords: this.extractKeywords(recall.productName),
            upcs: this.extractUPCs(recall.productName),
            brands: this.extractBrands(recall.productName),
            raw_data: recall,
          })
          result.success++
        } catch (error) {
          result.errors++
          console.error("Failed to process USDA recall:", error)
        }
      }
    } catch (error) {
      console.error("USDA recall sync failed:", error)
      result.errors++
    }

    return result
  }

  private async syncNHTSARecalls(): Promise<AgencyResult> {
    const result: AgencyResult = { success: 0, errors: 0 }

    try {
      // Get recent vehicle recalls
      const currentYear = new Date().getFullYear()
      const response = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?modelYear=${currentYear}`)

      if (!response.ok) {
        throw new Error(`NHTSA API returned ${response.status}`)
      }

      const data = await response.json()

      for (const recall of data.results?.slice(0, 50) || []) {
        try {
          await this.upsertRecall({
            agency: "NHTSA",
            recall_number: recall.NHTSACampaignNumber || `NHTSA-${Date.now()}-${Math.random()}`,
            title: `${recall.Make} ${recall.Model} ${recall.ModelYear} - ${recall.Component}`,
            description: recall.Summary || recall.Defect,
            recall_date: this.parseDate(recall.ReportReceivedDate),
            link: `https://www.nhtsa.gov/recalls?vin=${recall.NHTSACampaignNumber}`,
            severity: recall.PotentialNumberOfUnitsAffected > 100000 ? "high" : "medium",
            product_keywords: this.extractKeywords(`${recall.Make} ${recall.Model} ${recall.Component}`),
            upcs: [],
            brands: [recall.Make].filter(Boolean),
            raw_data: recall,
          })
          result.success++
        } catch (error) {
          result.errors++
          console.error("Failed to process NHTSA recall:", error)
        }
      }
    } catch (error) {
      console.error("NHTSA recall sync failed:", error)
      result.errors++
    }

    return result
  }

  private async syncCPSCRecalls(): Promise<AgencyResult> {
    const result: AgencyResult = { success: 0, errors: 0 }

    try {
      // CPSC doesn't have a public API, so we'll use their RSS feed
      const response = await fetch("https://www.cpsc.gov/Newsroom/News-Releases/RSS")
      const rssText = await response.text()

      // Simple RSS parsing (in production, use a proper XML parser)
      const items = this.parseRSSItems(rssText)

      for (const item of items.slice(0, 20)) {
        if (item.title.toLowerCase().includes("recall")) {
          try {
            await this.upsertRecall({
              agency: "CPSC",
              recall_number: `CPSC-${this.generateId(item.title)}`,
              title: item.title,
              description: item.description,
              recall_date: this.parseDate(item.pubDate),
              link: item.link,
              severity: this.determineCPSCSeverity(item.title, item.description),
              product_keywords: this.extractKeywords(item.title),
              upcs: this.extractUPCs(item.description),
              brands: this.extractBrands(item.title),
              raw_data: item,
            })
            result.success++
          } catch (error) {
            result.errors++
            console.error("Failed to process CPSC recall:", error)
          }
        }
      }
    } catch (error) {
      console.error("CPSC recall sync failed:", error)
      result.errors++
    }

    return result
  }

  private parseRSSItems(rssText: string): RSSItem[] {
    const items: RSSItem[] = []
    const itemRegex = /<item>(.*?)<\/item>/gs
    let match

    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemContent = match[1]
      const title = this.extractRSSField(itemContent, "title")
      const description = this.extractRSSField(itemContent, "description")
      const link = this.extractRSSField(itemContent, "link")
      const pubDate = this.extractRSSField(itemContent, "pubDate")

      if (title && description) {
        items.push({ title, description, link, pubDate })
      }
    }

    return items
  }

  private extractRSSField(content: string, field: string): string {
    const regex = new RegExp(`<${field}[^>]*>(.*?)<\/${field}>`, "s")
    const match = content.match(regex)
    return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, "$1").trim() : ""
  }

  private generateId(text: string): string {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 10) + Date.now()
    )
  }

  private determineCPSCSeverity(title: string, description: string): "low" | "medium" | "high" {
    const text = (title + " " + description).toLowerCase()
    if (text.includes("death") || text.includes("serious injury") || text.includes("choking")) {
      return "high"
    }
    if (text.includes("injury") || text.includes("burn") || text.includes("cut")) {
      return "medium"
    }
    return "low"
  }

  private async upsertRecall(recallData: Omit<Recall, "id" | "created_at" | "updated_at">): Promise<void> {
    try {
      await sql`
        INSERT INTO recalls (
          agency, external_id, title, description, recall_date, 
          link, severity, product_keywords, brand_keywords, upc_codes
        ) VALUES (
          ${recallData.agency}, ${recallData.recall_number}, ${recallData.title},
          ${recallData.description}, ${recallData.recall_date}, ${recallData.link},
          ${recallData.severity}, ${recallData.product_keywords}, ${recallData.brands},
          ${recallData.upcs}
        )
        ON CONFLICT (external_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          severity = EXCLUDED.severity,
          product_keywords = EXCLUDED.product_keywords,
          brand_keywords = EXCLUDED.brand_keywords,
          upc_codes = EXCLUDED.upc_codes,
          updated_at = NOW()
      `
    } catch (error) {
      console.error("Failed to upsert recall:", error)
      throw error
    }
  }

  private parseDate(dateString: string): string {
    if (!dateString) return new Date().toISOString().split("T")[0]

    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch {
      return new Date().toISOString().split("T")[0]
    }
  }

  private extractKeywords(text: string): string[] {
    if (!text) return []

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 20) // Limit keywords
  }

  private extractUPCs(text: string): string[] {
    if (!text) return []

    const upcPattern = /\b\d{12,14}\b/g
    return text.match(upcPattern) || []
  }

  private extractBrands(text: string): string[] {
    if (!text) return []

    // Simple brand extraction - could be enhanced with ML
    const brandPatterns = [/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g]

    const brands: string[] = []
    for (const pattern of brandPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        brands.push(...matches.slice(0, 5)) // Limit brands
      }
    }

    return [...new Set(brands)] // Remove duplicates
  }

  private mapFDASeverity(classification: string): "low" | "medium" | "high" {
    switch (classification) {
      case "Class I":
        return "high"
      case "Class II":
        return "medium"
      case "Class III":
        return "low"
      default:
        return "medium"
    }
  }
}

interface SyncResult {
  fda: AgencyResult
  usda: AgencyResult
  cpsc: AgencyResult
  nhtsa: AgencyResult
}

interface AgencyResult {
  success: number
  errors: number
}

interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
}
