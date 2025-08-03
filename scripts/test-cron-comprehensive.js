import fetch from "node-fetch"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET environment variable is required")
  process.exit(1)
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`)
  console.log(`📡 URL: ${url}`)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ ${name} - Success (${response.status})`)
      console.log("📊 Response:", JSON.stringify(data, null, 2))
    } else {
      console.log(`❌ ${name} - Failed (${response.status})`)
      console.log("📊 Error:", JSON.stringify(data, null, 2))
    }

    return { success: response.ok, status: response.status, data }
  } catch (error) {
    console.log(`💥 ${name} - Network Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log("🚀 Starting comprehensive cron endpoint tests...")
  console.log(`🌐 Base URL: ${BASE_URL}`)

  const results = []

  // Test 1: Status endpoint
  results.push(await testEndpoint("Status Check", `${BASE_URL}/api/cron/status`))

  // Test 2: Sync recalls endpoint (GET)
  results.push(await testEndpoint("Sync Recalls (GET)", `${BASE_URL}/api/cron/sync-recalls`))

  // Test 3: Sync recalls endpoint (POST)
  results.push(await testEndpoint("Sync Recalls (POST)", `${BASE_URL}/api/cron/sync-recalls`, { method: "POST" }))

  // Test 4: Unauthorized request
  results.push(
    await testEndpoint("Unauthorized Request", `${BASE_URL}/api/cron/status`, {
      headers: { Authorization: "Bearer invalid-secret" },
    }),
  )

  // Test 5: Missing auth header
  results.push(await testEndpoint("Missing Auth Header", `${BASE_URL}/api/cron/status`, { headers: {} }))

  // Summary
  console.log("\n📋 Test Summary:")
  console.log("================")

  const successful = results.filter((r) => r.success).length
  const total = results.length

  console.log(`✅ Successful: ${successful}/${total}`)
  console.log(`❌ Failed: ${total - successful}/${total}`)

  if (successful === total) {
    console.log("🎉 All tests passed!")
  } else {
    console.log("⚠️ Some tests failed. Check the logs above.")
  }
}

runTests().catch(console.error)
