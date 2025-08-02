#!/usr/bin/env node

const CRON_SECRET = process.env.CRON_SECRET || "test-secret"
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

async function testEnvironment() {
  console.log("🔧 Environment Check")
  console.log("===================")
  console.log(`CRON_SECRET: ${process.env.CRON_SECRET ? "✅ Set" : "❌ Not set"}`)
  console.log(`BASE_URL: ${BASE_URL}`)
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`)
  console.log("")
}

async function testDatabase() {
  console.log("🗄️  Database Check")
  console.log("==================")

  try {
    const response = await fetch(`${BASE_URL}/api/debug/database`)
    const data = await response.json()

    if (response.ok) {
      console.log("✅ Database connection: OK")
      console.log(`Tables found: ${data.tables?.length || 0}`)

      // Check for required tables
      const requiredTables = ["users", "products", "recalls", "user_recalls"]
      const existingTables = data.tables?.map((t) => t.table_name) || []

      requiredTables.forEach((table) => {
        if (existingTables.includes(table)) {
          console.log(`✅ Table '${table}': exists`)
        } else {
          console.log(`❌ Table '${table}': missing`)
        }
      })
    } else {
      console.log("❌ Database connection failed")
      console.log(data)
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`)
  }
  console.log("")
}

async function testExternalAPIs() {
  console.log("🌐 External API Check")
  console.log("=====================")

  const apis = [
    { name: "FDA Food", url: "https://api.fda.gov/food/enforcement.json?limit=1" },
    { name: "FDA Drug", url: "https://api.fda.gov/drug/enforcement.json?limit=1" },
    { name: "USDA", url: "https://www.fsis.usda.gov/fsis/api/recall" },
    { name: "CPSC RSS", url: "https://www.cpsc.gov/Newsroom/News-Releases/RSS" },
    { name: "NHTSA", url: `https://api.nhtsa.gov/recalls/recallsByVehicle?modelYear=${new Date().getFullYear()}` },
  ]

  for (const api of apis) {
    try {
      const response = await fetch(api.url, {
        headers: {
          "User-Agent": "RapidRecalls/1.0 (test@rapidrecalls.com)",
        },
      })

      if (response.ok) {
        console.log(`✅ ${api.name}: OK (${response.status})`)
      } else {
        console.log(`⚠️  ${api.name}: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${api.name}: ${error.message}`)
    }
  }
  console.log("")
}

async function testCronEndpoint() {
  console.log("⏰ Cron Endpoint Tests")
  console.log("======================")

  const tests = [
    {
      name: "Vercel Cron Header",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        "x-vercel-cron-secret": CRON_SECRET,
        "Content-Type": "application/json",
      },
    },
    {
      name: "Authorization Header",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    },
    {
      name: "Secret Parameter (GET)",
      url: `${BASE_URL}/api/cron/sync-recalls?secret=${CRON_SECRET}`,
      method: "GET",
    },
    {
      name: "Unauthorized Request",
      url: `${BASE_URL}/api/cron/sync-recalls`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  ]

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`)
    console.log(`   URL: ${test.url}`)
    console.log(`   Method: ${test.method}`)

    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers || {},
      })

      const data = await response.json()

      console.log(`   Status: ${response.status}`)

      if (response.status === 200) {
        console.log("   ✅ SUCCESS")
        if (data.syncResults) {
          console.log(`   📊 Sync Results:`)
          Object.entries(data.syncResults).forEach(([agency, result]) => {
            console.log(`      ${agency.toUpperCase()}: ${result.success} success, ${result.errors} errors`)
          })
        }
      } else if (response.status === 401 && test.name === "Unauthorized Request") {
        console.log("   ✅ CORRECTLY REJECTED (expected)")
      } else {
        console.log("   ❌ FAILED")
        console.log(`   Error: ${data.error || data.message}`)
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }
  }
}

async function testVercelConfig() {
  console.log("\n📋 Vercel Configuration Check")
  console.log("==============================")

  try {
    const fs = require("fs")
    const path = require("path")

    const vercelConfigPath = path.join(process.cwd(), "vercel.json")

    if (fs.existsSync(vercelConfigPath)) {
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"))
      console.log("✅ vercel.json exists")

      if (config.crons && config.crons.length > 0) {
        console.log("✅ Cron jobs configured:")
        config.crons.forEach((cron, index) => {
          console.log(`   ${index + 1}. Path: ${cron.path}`)
          console.log(`      Schedule: ${cron.schedule}`)
        })
      } else {
        console.log("❌ No cron jobs found in vercel.json")
      }
    } else {
      console.log("❌ vercel.json not found")
    }
  } catch (error) {
    console.log(`❌ Error reading vercel.json: ${error.message}`)
  }
}

async function main() {
  console.log("🚀 RapidRecalls Cron Diagnostic Tool")
  console.log("=====================================\n")

  await testEnvironment()
  await testDatabase()
  await testExternalAPIs()
  await testCronEndpoint()
  await testVercelConfig()

  console.log("\n🎯 Recommendations:")
  console.log("===================")
  console.log("1. Ensure CRON_SECRET environment variable is set in Vercel")
  console.log("2. Check that all database tables exist")
  console.log("3. Verify external API access (some may have rate limits)")
  console.log("4. Test the cron endpoint manually before relying on scheduled runs")
  console.log("5. Check Vercel function logs for any runtime errors")
  console.log("\n✨ Run this script locally and in production to compare results")
}

main().catch(console.error)
