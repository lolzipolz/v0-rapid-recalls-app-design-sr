#!/usr/bin/env node

async function testRecallAPIs() {
  console.log("🧪 Testing Recall APIs...")
  console.log("")

  const tests = [
    {
      name: "FDA Food Recalls",
      url: "https://api.fda.gov/food/enforcement.json?limit=5",
      method: "GET"
    },
    {
      name: "FDA Drug Recalls", 
      url: "https://api.fda.gov/drug/enforcement.json?limit=5",
      method: "GET"
    },
    {
      name: "USDA Meat/Poultry Recalls",
      url: "https://www.fsis.usda.gov/fsis/api/recall",
      method: "GET",
      headers: {
        "User-Agent": "RapidRecalls/1.0 (contact@rapidrecalls.com)"
      }
    },
    {
      name: "NHTSA Vehicle Recalls",
      url: `https://api.nhtsa.gov/recalls/recallsByVehicle?modelYear=${new Date().getFullYear()}`,
      method: "GET"
    },
    {
      name: "CPSC RSS Feed",
      url: "https://www.cpsc.gov/Newsroom/News-Releases/RSS",
      method: "GET"
    }
  ]

  for (const test of tests) {
    console.log(`🔍 Testing ${test.name}`)
    console.log(`URL: ${test.url}`)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers || {},
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ SUCCESS - Status: ${response.status}`)
        console.log(`📊 Response preview:`, JSON.stringify(data, null, 2).substring(0, 500) + "...")
      } else {
        console.log(`❌ FAILED - Status: ${response.status}`)
        console.log(`📄 Response:`, await response.text())
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
    
    console.log("")
  }
}

async function testDatabaseConnection() {
  console.log("🧪 Testing Database Connection...")
  
  try {
    const { sql } = await import("../lib/database.js")
    const result = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    console.log("Result:", result)
  } catch (error) {
    console.log("❌ Database connection failed:", error.message)
  }
  
  console.log("")
}

async function testRecallIngestion() {
  console.log("🧪 Testing Recall Ingestion Service...")
  
  try {
    const { RecallIngestionService } = await import("../lib/services/recall-ingestion.js")
    const service = RecallIngestionService.getInstance()
    
    console.log("Starting recall sync...")
    const results = await service.syncAllRecalls()
    
    console.log("✅ Recall sync completed successfully")
    console.log("Results:", JSON.stringify(results, null, 2))
  } catch (error) {
    console.log("❌ Recall sync failed:", error.message)
    console.log("Stack:", error.stack)
  }
}

async function main() {
  await testRecallAPIs()
  await testDatabaseConnection()
  await testRecallIngestion()
}

main().catch(console.error)
