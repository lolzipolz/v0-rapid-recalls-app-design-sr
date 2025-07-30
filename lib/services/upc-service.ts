export class UPCService {
  private static instance: UPCService

  static getInstance(): UPCService {
    if (!UPCService.instance) {
      UPCService.instance = new UPCService()
    }
    return UPCService.instance
  }

  async lookupProduct(upc: string): Promise<UPCProduct | null> {
    try {
      // Primary: OpenFoodFacts (FREE)
      const openFoodResult = await this.lookupOpenFoodFacts(upc)
      if (openFoodResult) return openFoodResult

      // Fallback: UPCitemdb (PAID - Optional)
      if (process.env.UPC_API_KEY) {
        const upcDbResult = await this.lookupUPCDatabase(upc)
        if (upcDbResult) return upcDbResult
      }

      // Final fallback: Basic UPC validation
      return this.createBasicProduct(upc)
    } catch (error) {
      console.error("UPC lookup failed:", error)
      return this.createBasicProduct(upc)
    }
  }

  private async lookupOpenFoodFacts(upc: string): Promise<UPCProduct | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upc}.json`, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
        },
      })

      if (!response.ok) return null

      const data = await response.json()

      if (data.status === 1 && data.product) {
        const product = data.product
        return {
          name: product.product_name || product.product_name_en || `Product ${upc}`,
          brand: product.brands?.split(",")[0]?.trim() || null,
          category: product.categories?.split(",")[0]?.trim() || null,
          image: product.image_url || null,
          source: "openfoodfacts",
          confidence: 0.9,
        }
      }

      return null
    } catch (error) {
      console.error("OpenFoodFacts lookup failed:", error)
      return null
    }
  }

  private async lookupUPCDatabase(upc: string): Promise<UPCProduct | null> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
        headers: {
          user_key: process.env.UPC_API_KEY!,
          key_type: "trial",
        },
      })

      if (!response.ok) return null

      const data = await response.json()

      if (data.code === "OK" && data.items && data.items.length > 0) {
        const item = data.items[0]
        return {
          name: item.title || `Product ${upc}`,
          brand: item.brand || null,
          category: item.category || null,
          image: item.images?.[0] || null,
          source: "upcitemdb",
          confidence: 0.95,
        }
      }

      return null
    } catch (error) {
      console.error("UPC Database lookup failed:", error)
      return null
    }
  }

  private createBasicProduct(upc: string): UPCProduct {
    return {
      name: `Product ${upc}`,
      brand: null,
      category: null,
      image: null,
      source: "manual",
      confidence: 0.5,
    }
  }

  // Validate UPC format
  isValidUPC(upc: string): boolean {
    // UPC-A: 12 digits, UPC-E: 8 digits, EAN-13: 13 digits
    return /^\d{8}$|^\d{12}$|^\d{13}$/.test(upc)
  }
}

export interface UPCProduct {
  name: string
  brand: string | null
  category: string | null
  image: string | null
  source: string
  confidence: number
}
