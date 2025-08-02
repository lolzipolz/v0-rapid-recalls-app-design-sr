const https = require("https")
const http = require("http")

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-here"

async function makeRequest(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RapidRecalls-Test/1.0",
      },
    }

    const client = urlObj.protocol === "https:" ? https : http

    const req = client.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on("error", reject)
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error("Request timeout"))
    })

    req.end()
  })
}

async function testCronEndpoint() {
  console.log("🧪 Testing Cron Endpoint Comprehensive Check")
  console.log("=".repeat(50))

  // Test 1: Check cron status endpoint
  console.log("\n1️⃣ Testing cron status endpoint...")
  try {
    const statusUrl = `${BASE_URL}/api/cron/status`
    const result = await makeRequest(statusUrl)

    if (result.status === 200) {
      console.log("✅ Status endpoint working")
      console.log("📊 Database stats:", result.data.stats)
      console.log("📈 Recall counts:", result.data.recalls)
    } else {
      console.log("❌ Status endpoint failed:", result.status, result.data)
    }
  } catch (error) {
    console.log("❌ Status endpoint error:", error.message)
  }

  // Test 2: Test cron endpoint without secret (should fail)
  console.log("\n2️⃣ Testing cron endpoint without secret (should fail)...")
  try {
    const cronUrl = `${BASE_URL}/api/cron/sync-recalls`
    const result = await makeRequest(cronUrl, "POST")

    if (result.status === 401) {
      console.log("✅ Security working - unauthorized request blocked")
    } else {
      console.log("⚠️ Security issue - request should have been blocked:", result.status)
    }
  } catch (error) {
    console.log("❌ Security test error:", error.message)
  }

  // Test 3: Test cron endpoint with secret (should work)
  console.log("\n3️⃣ Testing cron endpoint with secret...")
  try {
    const cronUrl = `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`
    console.log("🚀 Starting cron job test (this may take a while)...")

    const result = await makeRequest(cronUrl, "POST")

    if (result.status === 200) {
      console.log("✅ Cron job executed successfully!")
      console.log("📊 Results:", result.data)
    } else {
      console.log("❌ Cron job failed:", result.status, result.data)
    }
  } catch (error) {
    console.log("❌ Cron job error:", error.message)
  }

  // Test 4: Test GET method (for manual testing)
  console.log("\n4️⃣ Testing GET method with secret...")
  try {
    const cronUrl = `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`
    const result = await makeRequest(cronUrl, "GET")

    if (result.status === 200) {
      console.log("✅ GET method working (converts to POST)")
    } else {
      console.log("❌ GET method failed:", result.status, result.data)
    }
  } catch (error) {
    console.log("❌ GET method error:", error.message)
  }

  // Test 5: Check database after cron run
  console.log("\n5️⃣ Checking database state after cron run...")
  try {
    const statusUrl = `${BASE_URL}/api/cron/status`
    const result = await makeRequest(statusUrl)

    if (result.status === 200) {
      console.log("✅ Final database check:")
      console.log("   Users:", result.data.stats.total_users)
      console.log("   Products:", result.data.stats.total_products)
      console.log("   Pending matches:", result.data.stats.pending_matches)
      console.log("   Recent recalls:", result.data.recent_activity.recalls_last_24h)
    }
  } catch (error) {
    console.log("❌ Final check error:", error.message)
  }

  console.log("\n" + "=".repeat(50))
  console.log("🏁 Cron test completed!")
  console.log("\n💡 Next steps:")
  console.log("   1. Set CRON_SECRET in Vercel environment variables")
  console.log("   2. Update vercel.json with your actual secret")
  console.log("   3. Deploy to Vercel")
  console.log("   4. Check Vercel Functions logs for cron execution")
}

// Run the test
testCronEndpoint().catch(console.error)
