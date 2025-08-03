const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET || "this-is-a-cron-secret"

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`)
  console.log(`📡 URL: ${url}`)

  try {
    const response = await fetch(url, options)
    const data = await response.json()

    console.log(`📊 Status: ${response.status}`)
    console.log(`📋 Response:`, JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`)
    } else {
      console.log(`❌ ${name} - FAILED`)
    }

    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.log(`💥 ${name} - ERROR:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log("🚀 Starting comprehensive cron tests...")
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log(`🔑 Secret: ${CRON_SECRET}`)

  const results = []

  // Test 1: Cron status endpoint
  results.push(await testEndpoint("Cron Status", `${BASE_URL}/api/cron/status`))

  // Test 2: Cron sync with GET (correct secret)
  results.push(
    await testEndpoint("Cron Sync GET (with secret)", `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`),
  )

  // Test 3: Cron sync with POST (correct secret)
  results.push(
    await testEndpoint("Cron Sync POST (with secret)", `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`, {
      method: "POST",
    }),
  )

  // Test 4: Cron sync without secret (should fail)
  results.push(await testEndpoint("Cron Sync (no secret - should fail)", `${BASE_URL}/api/cron/sync-recalls`))

  // Test 5: Cron sync with wrong secret (should fail)
  results.push(
    await testEndpoint(
      "Cron Sync (wrong secret - should fail)",
      `${BASE_URL}/api/cron/sync-recalls?secret=wrong-secret`,
    ),
  )

  // Summary
  console.log("\n📊 TEST SUMMARY:")
  console.log("=".repeat(50))

  const passed = results.filter((r) => r.success).length
  const total = results.length

  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log("🎉 All tests passed!")
  } else {
    console.log("⚠️ Some tests failed. Check the logs above.")
  }

  // Environment check
  console.log("\n🔧 ENVIRONMENT CHECK:")
  console.log(`CRON_SECRET: ${process.env.CRON_SECRET ? "✅ Set" : "❌ Missing"}`)
  console.log(`BASE_URL: ${process.env.BASE_URL || "❌ Using localhost"}`)
}

// Run the tests
runTests().catch(console.error)
