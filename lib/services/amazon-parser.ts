import { parse } from "csv-parse/sync"

export class AmazonParser {
  private static instance: AmazonParser

  static getInstance(): AmazonParser {
    if (!AmazonParser.instance) {
      AmazonParser.instance = new AmazonParser()
    }
    return AmazonParser.instance
  }

  async parseAmazonCSV(csvBuffer: Buffer): Promise<AmazonProduct[]> {
    try {
      const csvText = csvBuffer.toString("utf-8")
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

      return records
        .filter((record: any) => this.isValidAmazonRecord(record))
        .map((record: any) => this.transformAmazonRecord(record))
    } catch (error) {
      console.error("Amazon CSV parsing failed:", error)
      throw new Error("Failed to parse Amazon CSV file")
    }
  }

  private isValidAmazonRecord(record: any): boolean {
    return (
      record["Order Date"] &&
      record["Title"] &&
      record["Item Total"] &&
      !record["Title"].toLowerCase().includes("shipping") &&
      !record["Title"].toLowerCase().includes("tax")
    )
  }

  private transformAmazonRecord(record: any): AmazonProduct {
    const orderDate = new Date(record["Order Date"])
    const price = this.parsePrice(record["Item Total"])

    return {
      name: this.normalizeProductName(record["Title"]),
      originalTitle: record["Title"],
      brand: this.extractBrand(record["Title"]),
      orderDate: orderDate.toISOString().split("T")[0],
      price,
      asin: record["ASIN"] || null,
      category: record["Category"] || null,
      orderNumber: record["Order ID"] || null,
    }
  }

  private parsePrice(priceString: string): number {
    const match = priceString.match(/[\d,]+\.?\d*/)
    return match ? Number.parseFloat(match[0].replace(",", "")) : 0
  }

  private extractBrand(title: string): string | null {
    // Common brand extraction patterns
    const brandPatterns = [
      /^([A-Z][a-zA-Z]+)\s+/, // Brand at start
      /by\s+([A-Z][a-zA-Z]+)/i, // "by Brand"
    ]

    for (const pattern of brandPatterns) {
      const match = title.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  private normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
}

export interface AmazonProduct {
  name: string
  originalTitle: string
  brand: string | null
  orderDate: string
  price: number
  asin: string | null
  category: string | null
  orderNumber: string | null
}
