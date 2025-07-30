import { NextResponse } from "next/server"
import { UPCService } from "@/lib/services/upc-service"

export async function GET() {
  const results = {
    apis: {
      fda: { status: "unknown", message: "" },
      usda: { status: "unknown", message: "" },
      nhtsa: { status: "unknown", message: "" },
      cpsc: { status: "unknown", message: "" },
      openfoodfacts: { status: "unknown", message: "" },
    },
    timestamp: new Date().toISOString(),
  }

  // Test FDA API
  try {
    const fdaResponse = await fetch("https://api.fda.gov/food/enforcement.json?limit=1")
    if (fdaResponse.ok) {
      results.apis.fda = { status: "working", message: "FDA API is accessible" }
    } else {
      results.apis.fda = { status: "error", message: `FDA API returned ${fdaResponse.status}` }
    }
  } catch (error) {
    results.apis.fda = { status: "error", message: "FDA API connection failed" }
  }

  // Test USDA API
  try {
    const usdaResponse = await fetch("https://www.fsis.usda.gov/fsis/api/recall")
    if (usdaResponse.ok) {
      results.apis.usda = { status: "working", message: "USDA API is accessible" }
    } else {
      results.apis.usda = { status: "error", message: `USDA API returned ${usdaResponse.status}` }
    }
  } catch (error) {
    results.apis.usda = { status: "error", message: "USDA API connection failed" }
  }

  // Test NHTSA API
  try {
    const nhtsaResponse = await fetch("https://api.nhtsa.gov/recalls/recallsByVehicle?modelYear=2024")
    if (nhtsaResponse.ok) {
      results.apis.nhtsa = { status: "working", message: "NHTSA API is accessible" }
    } else {
      results.apis.nhtsa = { status: "error", message: `NHTSA API returned ${nhtsaResponse.status}` }
    }
  } catch (error) {
    results.apis.nhtsa = { status: "error", message: "NHTSA API connection failed" }
  }

  // Test CPSC RSS
  try {
    const cpscResponse = await fetch("https://www.cpsc.gov/Newsroom/News-Releases/RSS")
    if (cpscResponse.ok) {
      results.apis.cpsc = { status: "working", message: "CPSC RSS feed is accessible" }
    } else {
      results.apis.cpsc = { status: "error", message: `CPSC RSS returned ${cpscResponse.status}` }
    }
  } catch (error) {
    results.apis.cpsc = { status: "error", message: "CPSC RSS connection failed" }
  }

  // Test OpenFoodFacts
  try {
    const upcService = UPCService.getInstance()
    const testProduct = await upcService.lookupProduct("0123456789012")
    results.apis.openfoodfacts = {
      status: "working",
      message: "OpenFoodFacts API is accessible (may return null for invalid UPCs)",
    }
  } catch (error) {
    results.apis.openfoodfacts = { status: "error", message: "OpenFoodFacts API connection failed" }
  }

  return NextResponse.json(results)
}
