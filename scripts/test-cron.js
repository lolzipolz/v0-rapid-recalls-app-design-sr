#!/usr/bin/env node

const CRON_SECRET = process.env.CRON_SECRET || "test-secret"
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

async function testCronEndpoint() {
  console.log("🧪 Testing cron endpoint...")
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Cron Secret: ${CRON_SECRET ? "Set" : "Not set"}`)
  console.log("")

  const tests = [
    {
      name: "Test with secret parameter",
      url: `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`,
      method: "GET"
    },
    {
      name: "Test with Authorization header",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json"
      }
    },
    {
      name: "Test with Vercel-like user agent",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        "User-Agent": "Vercel/1.0",
        "Content-Type": "application/json"
      }
    },
    {
      name: "Test unauthorized request",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }
  ]

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`)
    console.log(`URL: ${test.url}`)
    console.log(`Method: ${test.method}`)
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers || {}
      })
      
      const data = await response.json()
      
      console.log(`Status: ${response.status}`)
      console.log(`Response:`, JSON.stringify(data, null, 2))
      
      if (response.status === 200) {
        console.log("✅ SUCCESS")
      } else {
        console.log("❌ FAILED")
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
  }
}

// Test the test endpoint too
async function testTestEndpoint() {
  console.log("\n\n🧪 Testing test endpoint...")
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-apis`)
    const data = await response.json()
    
    console.log("Test endpoint response:")
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`)
  }
}

async function main() {
  await testCronEndpoint()
  await testTestEndpoint()
}

main().catch(console.error) 