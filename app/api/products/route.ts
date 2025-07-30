import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { OCRService } from "@/lib/services/ocr-service"
import { AmazonParser } from "@/lib/services/amazon-parser"
import { UPCService } from "@/lib/services/upc-service"
import { MatchingEngine } from "@/lib/services/matching-engine"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const products = await sql`
      SELECT * FROM products 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get("userId") as string
    const source = formData.get("source") as string

    if (!userId || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let products: any[] = []

    switch (source) {
      case "manual":
        products = await handleManualEntry(formData)
        break
      case "receipt_ocr":
        products = await handleReceiptUpload(formData)
        break
      case "amazon_csv":
        products = await handleAmazonCSV(formData)
        break
      case "upc_scan":
        products = await handleUPCScan(formData)
        break
      default:
        return NextResponse.json({ error: "Invalid source" }, { status: 400 })
    }

    // Save products to database
    const savedProducts = []
    for (const product of products) {
      const result = await sql`
        INSERT INTO products (
          user_id, name, brand, model, upc, purchase_date, 
          purchase_price, source, source_metadata, normalized_name
        ) VALUES (
          ${userId}, ${product.name}, ${product.brand || null}, 
          ${product.model || null}, ${product.upc || null}, 
          ${product.purchase_date || null}, ${product.price || null},
          ${source}, ${JSON.stringify(product.metadata || {})},
          ${normalizeProductName(product.name)}
        )
        RETURNING *
      `
      savedProducts.push(result[0])
    }

    // Trigger matching for new products
    const matchingEngine = MatchingEngine.getInstance()
    await matchingEngine.findMatches(userId)

    return NextResponse.json({
      message: "Products added successfully",
      products: savedProducts,
    })
  } catch (error) {
    console.error("Failed to add products:", error)
    return NextResponse.json({ error: "Failed to add products" }, { status: 500 })
  }
}

async function handleManualEntry(formData: FormData) {
  return [
    {
      name: formData.get("name") as string,
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      upc: formData.get("upc") as string,
      purchase_date: formData.get("purchase_date") as string,
      price: formData.get("price") ? Number.parseFloat(formData.get("price") as string) : null,
    },
  ]
}

async function handleReceiptUpload(formData: FormData) {
  const file = formData.get("receipt") as File
  if (!file) throw new Error("No receipt file provided")

  const buffer = Buffer.from(await file.arrayBuffer())
  const ocrService = OCRService.getInstance()
  const extractedProducts = await ocrService.extractProductsFromReceipt(buffer)

  return extractedProducts.map((product) => ({
    name: product.name,
    price: product.price,
    metadata: { confidence: product.confidence },
  }))
}

async function handleAmazonCSV(formData: FormData) {
  const file = formData.get("amazon_csv") as File
  if (!file) throw new Error("No Amazon CSV file provided")

  const buffer = Buffer.from(await file.arrayBuffer())
  const amazonParser = AmazonParser.getInstance()
  const amazonProducts = await amazonParser.parseAmazonCSV(buffer)

  return amazonProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    purchase_date: product.orderDate,
    price: product.price,
    metadata: {
      asin: product.asin,
      category: product.category,
      orderNumber: product.orderNumber,
      originalTitle: product.originalTitle,
    },
  }))
}

async function handleUPCScan(formData: FormData) {
  const upc = formData.get("upc") as string
  if (!upc) throw new Error("No UPC provided")

  const upcService = UPCService.getInstance()
  const productInfo = await upcService.lookupProduct(upc)

  if (!productInfo) {
    throw new Error("Product not found for UPC")
  }

  return [
    {
      name: productInfo.name,
      brand: productInfo.brand,
      upc,
      metadata: {
        category: productInfo.category,
        image: productInfo.image,
        source: productInfo.source,
      },
    },
  ]
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
