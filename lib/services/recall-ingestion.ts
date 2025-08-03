import { sql } from "@/lib/database"
import { safeDate } from "@/lib/utils"

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
      console.log("📡 Starting FDA sync...")
      const fdaCount = await this.syncFDARecalls()
      results.fda = { success: true, count: fdaCount, error: null }
      console.log(`✅ FDA sync completed: ${fdaCount} recalls`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      results.fda.error = errorMessage
      console.error("❌ FDA sync failed:", errorMessage)
    }

    // Sync CPSC recalls
    try {
      console.log("📡 Starting CPSC sync...")
      const cpscCount = await this.syncCPSCRecalls()
      results.cpsc = { success: true, count: cpscCount, error: null }
      console.log(`✅ CPSC sync completed: ${cpscCount} recalls`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      results.cpsc.error = errorMessage
      console.error("❌ CPSC sync failed:", errorMessage)
    }

    // Sync NHTSA recalls
    try {
      console.log("📡 Starting NHTSA sync...")
      const nhtsaCount = await this.syncNHTSARecalls()
      results.nhtsa = { success: true, count: nhtsaCount, error: null }
      console.log(`✅ NHTSA sync completed: ${nhtsaCount} recalls`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      results.nhtsa.error = errorMessage
      console.error("❌ NHTSA sync failed:", errorMessage)
    }

    const totalCount = results.fda.count + results.cpsc.count + results.nhtsa.count
    console.log(`🎯 Total recalls synced: ${totalCount}`)

    return results
  }

  private async syncFDARecalls(): Promise<number> {
    console.log("📡 Fetching FDA recalls...")

    // Get recent recalls (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateFilter = thirtyDaysAgo.toISOString().split("T")[0].replace(/-/g, "")

    const url = `${this.baseUrls.fda}?search=report_date:[${dateFilter}+TO+*]&limit=50`
    console.log(`🔗 FDA URL: ${url}`)

    const response = await fetch(url, {
      headers: {
        "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const recalls = data.results || []
    console.log(`📊 FDA returned ${recalls.length} recalls`)

    let processedCount = 0
    for (const recall of recalls) {
      try {
        console.log(`🔄 Processing FDA recall: ${recall.recall_number}`)
        await this.upsertRecall({
          external_id: recall.recall_number || `fda-${recall.event_id || Date.now()}`,
          source: "FDA",
          title: recall.product_description || "FDA Food Recall",
          description: recall.reason_for_recall || "",
          date_published: safeDate(recall.recall_initiation_date || recall.report_date || new Date()),
          recall_date: safeDate(recall.recall_initiation_date || recall.report_date),
          severity: this.mapFDASeverity(recall.classification),
          product_keywords: this.extractProductKeywords(recall.product_description || ""),
          brand_keywords: this.extractBrandKeywords(recall.recalling_firm || ""),
          upc_codes: [],
          raw_data: recall,
        })
        processedCount++
        console.log(`✅ Processed FDA recall: ${recall.recall_number}`)
      } catch (error) {
        console.error(`❌ Failed to process FDA recall ${recall.recall_number}:`, error)
      }
    }

    return processedCount
  }

  private async syncCPSCRecalls(): Promise<number> {
    console.log("📡 Fetching CPSC recalls...")

    try {
      // CPSC doesn't have a reliable public API, but we can try their RSS feed
      const response = await fetch("https://www.cpsc.gov/Newsroom/News-Releases/RSS", {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        console.log("⚠️ CPSC RSS feed not available, skipping...")
        return 0
      }

      const rssText = await response.text()
      const items = this.parseRSSItems(rssText)

      let processedCount = 0
      for (const item of items.slice(0, 10)) {
        if (item.title.toLowerCase().includes("recall")) {
          try {
            await this.upsertRecall({
              external_id: `cpsc-${this.generateId(item.title)}`,
              source: "CPSC",
              title: item.title,
              description: item.description,
              date_published: safeDate(item.pubDate || new Date()),
              recall_date: safeDate(item.pubDate),
              severity: this.determineCPSCSeverity(item.title, item.description),
              product_keywords: this.extractProductKeywords(item.title),
              brand_keywords: this.extractBrandKeywords(item.title),
              upc_codes: [],
              raw_data: item,
            })
            processedCount++
          } catch (error) {
            console.error(`❌ Failed to process CPSC recall:`, error)
          }
        }
      }

      return processedCount
    } catch (error) {
      console.log("⚠️ CPSC sync failed, continuing with other sources...")
      return 0
    }
  }

  private async syncNHTSARecalls(): Promise<number> {
    console.log("📡 Fetching NHTSA recalls...")

    try {
      // NHTSA API for recent recalls
      const currentYear = new Date().getFullYear()
      const url = `${this.baseUrls.nhtsa}?modelYear=${currentYear}&format=json`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) {
        console.log("⚠️ NHTSA API not available, skipping...")
        return 0
      }

      const data = await response.json()
      const recalls = data.results || []

      let processedCount = 0
      for (const recall of recalls.slice(0, 20)) {
        try {
          await this.upsertRecall({
            external_id: recall.NHTSACampaignNumber || `nhtsa-${recall.NHTSAActionNumber || Date.now()}`,
            source: "NHTSA",
            title: `${recall.Make} ${recall.Model} ${recall.ModelYear} - ${recall.Component}`,
            description: recall.Summary || recall.Defect || "",
            date_published: safeDate(recall.ReportReceivedDate || new Date()),
            recall_date: safeDate(recall.ReportReceivedDate),
            severity: this.mapNHTSASeverity(recall.DefectSeverity),
            product_keywords: this.extractProductKeywords(`${recall.Make} ${recall.Model} ${recall.Component}`),
            brand_keywords: this.extractBrandKeywords(recall.Make || ""),
            upc_codes: [],
            raw_data: recall,
          })
          processedCount++
        } catch (error) {
          console.error(`❌ Failed to process NHTSA recall:`, error)
        }
      }

      return processedCount
    } catch (error) {
      console.log("⚠️ NHTSA sync failed, continuing with other sources...")
      return 0
    }
  }

  private parseRSSItems(rssText: string): Array<{ title: string; description: string; link: string; pubDate: string }> {
    const items: Array<{ title: string; description: string; link: string; pubDate: string }> = []
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

  private async upsertRecall(recallData: {
    external_id: string
    source: string
    title: string
    description: string
    date_published: Date
    recall_date: Date
    severity: string
    product_keywords: string[]
    brand_keywords: string[]
    upc_codes: string[]
    raw_data: any
  }) {
    console.log(`💾 Upserting recall: ${recallData.external_id}`)

    try {
      await sql`
        INSERT INTO recalls (
          external_id, source, title, description, date_published, recall_date,
          severity, product_keywords, brand_keywords, upc_codes, raw_data
        ) VALUES (
          ${recallData.external_id},
          ${recallData.source},
          ${recallData.title},
          ${recallData.description},
          ${recallData.date_published},
          ${recallData.recall_date},
          ${recallData.severity},
          ${recallData.product_keywords},
          ${recallData.brand_keywords},
          ${recallData.upc_codes},
          ${recallData.raw_data}
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
          recall_date = EXCLUDED.recall_date,
          updated_at = NOW()
      `
      console.log(`✅ Successfully upserted recall: ${recallData.external_id}`)
    } catch (error) {
      console.error(`❌ Database error for recall ${recallData.external_id}:`, error)
      throw error
    }
  }

  private mapFDASeverity(classification: string): string {
    if (!classification) return "medium"

    const cls = classification.toLowerCase()
    if (cls.includes("class i")) return "high"
    if (cls.includes("class ii")) return "medium"
    if (cls.includes("class iii")) return "low"

    console.log(`⚠️ Unknown FDA classification: ${classification}, defaulting to medium`)
    return "medium"
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

    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10) // Limit to 10 keywords

    console.log(`🔍 Extracted ${keywords.length} product keywords from: "${text.substring(0, 50)}..."`)
    return keywords
  }

  private extractBrandKeywords(text: string): string[] {
    if (!text) return []

    // Extract brand names (usually proper nouns)
    const brands = text
      .split(/[,\s]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 1)
      .slice(0, 5) // Limit to 5 brand keywords

    console.log(`🏷️ Extracted ${brands.length} brand keywords from: "${text.substring(0, 50)}..."`)
    return brands
  }

  private safeDate(input: string | Date | null | undefined): Date {
  const d = new Date(input ?? "")
  return isNaN(d.getTime()) ? new Date() : d
  }
}
