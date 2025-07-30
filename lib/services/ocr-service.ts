// Enhanced OCR Service with better receipt parsing
export class OCRService {
  private static instance: OCRService

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  async extractProductsFromReceipt(imageBuffer: Buffer): Promise<ExtractedProduct[]> {
    try {
      // For production, integrate with Google Vision API, AWS Textract, or Azure Computer Vision
      const ocrText = await this.performOCR(imageBuffer)
      return this.parseReceiptText(ocrText)
    } catch (error) {
      console.error("OCR extraction failed:", error)
      throw new Error("Failed to extract products from receipt")
    }
  }

  private async performOCR(imageBuffer: Buffer): Promise<string> {
    // Production implementation with Google Vision API:
    /*
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
    });
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer }
    });
    
    return result.fullTextAnnotation?.text || '';
    */

    // Mock OCR for demo - replace with actual service
    return this.getMockReceiptText()
  }

  private getMockReceiptText(): string {
    const mockReceipts = [
      `
      WALMART SUPERCENTER #1234
      123 MAIN ST, ANYTOWN USA
      
      iPhone 15 Pro 128GB          $999.99
      Apple AirPods Pro 2nd Gen    $249.99
      Samsung Galaxy Buds2         $149.99
      Instant Pot Duo 7-in-1       $79.99
      Ninja Foodi Personal Blender  $39.99
      
      SUBTOTAL                    $1519.95
      TAX                          $121.60
      TOTAL                       $1641.55
      `,
      `
      TARGET STORE #5678
      456 OAK AVE, SOMEWHERE USA
      
      Dyson V15 Detect Vacuum     $749.99
      KitchenAid Stand Mixer      $379.99
      Fitbit Charge 5             $199.99
      Echo Dot (4th Gen)           $49.99
      
      SUBTOTAL                     $1379.96
      TAX                          $110.40
      TOTAL                        $1490.36
      `,
    ]

    return mockReceipts[Math.floor(Math.random() * mockReceipts.length)]
  }

  private parseReceiptText(text: string): ExtractedProduct[] {
    const lines = text.split("\n").filter((line) => line.trim())
    const products: ExtractedProduct[] = []

    // Enhanced regex patterns for different receipt formats
    const productPatterns = [
      /^(.+?)\s+\$(\d+\.?\d*)$/, // "Product Name $99.99"
      /^(.+?)\s*-\s*\$(\d+\.?\d*)$/, // "Product Name - $99.99"
      /^(.+?)\s+(\d+\.?\d*)\s*$/, // "Product Name 99.99"
      /^(.+?)\s*\$(\d+\.?\d*)\s*$/, // "Product Name $99.99"
      /^(.+?)\s+@\s*\$(\d+\.?\d*)$/, // "Product Name @ $99.99"
    ]

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip store info, totals, etc.
      if (this.shouldSkipLine(trimmedLine)) continue

      for (const pattern of productPatterns) {
        const match = trimmedLine.match(pattern)
        if (match && match[1] && match[2]) {
          const name = match[1].trim()
          const price = Number.parseFloat(match[2])

          if (this.isValidProductName(name) && price > 0 && price < 10000) {
            products.push({
              name: this.normalizeProductName(name),
              price,
              confidence: this.calculateConfidence(name, price),
              brand: this.extractBrandFromName(name),
            })
          }
          break
        }
      }
    }

    return this.deduplicateProducts(products)
  }

  private shouldSkipLine(line: string): boolean {
    const skipPatterns = [
      /^(sub)?total/i,
      /^tax/i,
      /^change/i,
      /^cash/i,
      /^credit/i,
      /^debit/i,
      /walmart|target|costco|kroger/i,
      /store|receipt|thank you/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // dates
      /^\d{1,2}:\d{2}/, // times
      /^#{2,}/, // multiple #
      /^-{2,}/, // multiple -
    ]

    return skipPatterns.some((pattern) => pattern.test(line))
  }

  private isValidProductName(name: string): boolean {
    return name.length > 2 && name.length < 100 && !/^\d+$/.test(name) && !/(qty|quantity|each|ea\.)/i.test(name)
  }

  private calculateConfidence(name: string, price: number): number {
    let confidence = 0.7 // base confidence

    // Higher confidence for branded products
    if (this.hasBrandIndicators(name)) confidence += 0.1

    // Higher confidence for reasonable prices
    if (price >= 10 && price <= 1000) confidence += 0.1

    // Lower confidence for very generic names
    if (name.length < 10) confidence -= 0.1

    return Math.min(0.95, Math.max(0.5, confidence))
  }

  private hasBrandIndicators(name: string): boolean {
    const brandKeywords = [
      "apple",
      "samsung",
      "sony",
      "lg",
      "nike",
      "adidas",
      "kitchenaid",
      "dyson",
      "instant pot",
      "ninja",
      "fitbit",
    ]

    const lowerName = name.toLowerCase()
    return brandKeywords.some((brand) => lowerName.includes(brand))
  }

  private extractBrandFromName(name: string): string | null {
    const brandPatterns = [
      /^(Apple|Samsung|Sony|LG|Nike|Adidas|KitchenAid|Dyson|Ninja|Fitbit)\b/i,
      /\b(iPhone|iPad|Galaxy|PlayStation|Xbox)\b/i,
    ]

    for (const pattern of brandPatterns) {
      const match = name.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  private normalizeProductName(name: string): string {
    return name
      .replace(/\s+/g, " ")
      .replace(/[^\w\s-]/g, "")
      .trim()
  }

  private deduplicateProducts(products: ExtractedProduct[]): ExtractedProduct[] {
    const seen = new Set<string>()
    return products.filter((product) => {
      const key = product.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}

export interface ExtractedProduct {
  name: string
  price: number
  confidence: number
  brand?: string | null
}
