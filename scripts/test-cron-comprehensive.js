const fetch = require("node-fetch")

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET || "this-is-a-cron-secret"

async function testCronEndpoint() {
  console.log("🧪 Testing Cron Endpoint Comprehensive")
  console.log("=====================================")

  // Test 1: Check cron status endpoint
  console.log("\n1️⃣ Testing cron status endpoint...")
  try {
    const response = await fetch(`${BASE_URL}/api/cron/status`)
    const data = await response.json()

    if (response.ok) {
      console.log("✅ Status endpoint working")
      console.log("📊 Status:", data.status)
      console.log("🗄️ Database connected:", data.database_connected)
      console.log("👥 Total users:", data.user_stats?.total_users || 0)
      console.log("📦 Total products:", data.user_stats?.total_products || 0)
    } else {
      console.log("❌ Status endpoint failed:", response.status)
      console.log("📄 Response:", data)
    }
  } catch (error) {
    console.log("❌ Status endpoint error:", error.message)
  }

  // Test 2: Test cron endpoint with correct secret
  console.log("\n2️⃣ Testing cron endpoint with correct secret...")
  try {
    const response = await fetch(`${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`, {
      method: "POST",
    })
    const data = await response.json()

    if (response.ok) {
      console.log("✅ Cron endpoint working with correct secret")
      console.log("📊 Success:", data.success)
      console.log("⏱️ Duration:", data.duration)
      console.log("👥 Users processed:", data.usersProcessed)
      console.log("🔍 New matches:", data.newMatches)
    } else {
      console.log("❌ Cron endpoint failed:", response.status)
      console.log("📄 Response:", data)
    }
  } catch (error) {
    console.log("❌ Cron endpoint error:", error.message)
  }

  // Test 3: Test cron endpoint with wrong secret
  console.log("\n3️⃣ Testing cron endpoint with wrong secret...")
  try {
    const response = await fetch(`${BASE_URL}/api/cron/sync-recalls?secret=wrong-secret`, {
      method: "POST",
    })
    const data = await response.json()

    if (response.status === 401) {
      console.log("✅ Correctly rejected wrong secret")
      console.log("📄 Response:", data)
    } else {
      console.log("❌ Should have rejected wrong secret but got:", response.status)
      console.log("📄 Response:", data)
    }
  } catch (error) {
    console.log("❌ Wrong secret test error:", error.message)
  }

  // Test 4: Test cron endpoint with no secret
  console.log("\n4️⃣ Testing cron endpoint with no secret...")
  try {
    const response = await fetch(`${BASE_URL}/api/cron/sync-recalls`, {
      method: "POST",
    })
    const data = await response.json()

    if (response.status === 401) {
      console.log("✅ Correctly rejected missing secret")
      console.log("📄 Response:", data)
    } else {
      console.log("❌ Should have rejected missing secret but got:", response.status)
      console.log("📄 Response:", data)
    }
  } catch (error) {
    console.log("❌ No secret test error:", error.message)
  }

  // Test 5: Test GET method
  console.log("\n5️⃣ Testing GET method with correct secret...")
  try {
    const response = await fetch(`${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`, {
      method: "GET",
    })
    const data = await response.json()

    if (response.ok) {
      console.log("✅ GET method working")
      console.log("📊 Success:", data.success)
    } else {
      console.log("❌ GET method failed:", response.status)
      console.log("📄 Response:", data)
    }
  } catch (error) {
    console.log("❌ GET method error:", error.message)
  }

  console.log("\n🏁 Cron endpoint testing complete!")
}

// Run the test
testCronEndpoint().catch(console.error)
