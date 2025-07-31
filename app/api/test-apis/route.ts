import { NextResponse } from "next/server"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    apis: {} as Record<string, any>,
  }

  // Test FDA API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const fdaResponse = await fetch("https://api.fda.gov/food/enforcement.json?limit=1", {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    results.apis.fda = {
      status: fdaResponse.ok ? "✅ Working" : "❌ Error",
      statusCode: fdaResponse.status,
      url: "https://api.fda.gov/food/enforcement.json",
    }
  } catch (error) {
    results.apis.fda = {
      status: "❌ Timeout/Error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "https://api.fda.gov/food/enforcement.json",
    }
  }

  // Test USDA API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const usdaResponse = await fetch("https://www.fsis.usda.gov/fsis/api/recall", {
      signal: controller.signal,
      headers: {
        "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)",
      },
    })
    clearTimeout(timeoutId)

    results.apis.usda = {
      status: usdaResponse.ok ? "✅ Working" : "❌ Error",
      statusCode: usdaResponse.status,
      url: "https://www.fsis.usda.gov/fsis/api/recall",
    }
  } catch (error) {
    results.apis.usda = {
      status: "❌ Timeout/Error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "https://www.fsis.usda.gov/fsis/api/recall",
    }
  }

  // Test NHTSA API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const nhtsaResponse = await fetch("https://api.nhtsa.gov/recalls/recallsByVehicle?modelYear=2024", {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    results.apis.nhtsa = {
      status: nhtsaResponse.ok ? "✅ Working" : "❌ Error",
      statusCode: nhtsaResponse.status,
      url: "https://api.nhtsa.gov/recalls/recallsByVehicle",
    }
  } catch (error) {
    results.apis.nhtsa = {
      status: "❌ Timeout/Error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "https://api.nhtsa.gov/recalls/recallsByVehicle",
    }
  }

  // Test CPSC RSS
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const cpscResponse = await fetch("https://www.cpsc.gov/Newsroom/News-Releases/RSS", {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    results.apis.cpsc = {
      status: cpscResponse.ok ? "✅ Working" : "❌ Error",
      statusCode: cpscResponse.status,
      url: "https://www.cpsc.gov/Newsroom/News-Releases/RSS",
    }
  } catch (error) {
    results.apis.cpsc = {
      status: "❌ Timeout/Error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "https://www.cpsc.gov/Newsroom/News-Releases/RSS",
    }
  }

  // Test OpenFoodFacts (UPC lookup)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const offResponse = await fetch("https://world.openfoodfacts.org/api/v0/product/737628064502.json", {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    results.apis.openfoodfacts = {
      status: offResponse.ok ? "✅ Working" : "❌ Error",
      statusCode: offResponse.status,
      url: "https://world.openfoodfacts.org/api/v0/product/",
    }
  } catch (error) {
    results.apis.openfoodfacts = {
      status: "❌ Timeout/Error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "https://world.openfoodfacts.org/api/v0/product/",
    }
  }

  return NextResponse.json(results)
}
