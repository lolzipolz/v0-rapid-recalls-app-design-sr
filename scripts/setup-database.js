#!/usr/bin/env node

import { sql, initializeDatabase } from "../lib/database.js"

async function setupDatabase() {
  console.log("🔧 Setting up database...")
  
  try {
    // Initialize database (creates tables if they don't exist)
    await initializeDatabase()
    
    console.log("✅ Database setup completed")
    
    // Test the recalls table structure
    console.log("\n🔍 Testing recalls table structure...")
    const recallsStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'recalls'
      ORDER BY ordinal_position
    `
    
    console.log("Recalls table columns:")
    recallsStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Test the matched_recalls table structure
    console.log("\n🔍 Testing matched_recalls table structure...")
    const matchedRecallsStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'matched_recalls'
      ORDER BY ordinal_position
    `
    
    console.log("Matched_recalls table columns:")
    matchedRecallsStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Test inserting a sample recall
    console.log("\n🧪 Testing recall insertion...")
    const testRecall = {
      agency: "TEST",
      recall_number: `TEST-${Date.now()}`,
      title: "Test Recall",
      description: "This is a test recall",
      recall_date: new Date().toISOString().split("T")[0],
      link: "https://example.com",
      severity: "medium",
      product_keywords: ["test", "product"],
      brands: ["TestBrand"],
      upcs: ["123456789012"]
    }
    
    try {
      await sql`
        INSERT INTO recalls (
          agency, external_id, title, description, recall_date, 
          link, severity, product_keywords, brand_keywords, upc_codes
        ) VALUES (
          ${testRecall.agency}, ${testRecall.recall_number}, ${testRecall.title},
          ${testRecall.description}, ${testRecall.recall_date}, ${testRecall.link},
          ${testRecall.severity}, ${testRecall.product_keywords}, ${testRecall.brands},
          ${testRecall.upcs}
        )
      `
      console.log("✅ Test recall inserted successfully")
      
      // Clean up test data
      await sql`DELETE FROM recalls WHERE agency = 'TEST'`
      console.log("✅ Test data cleaned up")
      
    } catch (error) {
      console.log("❌ Test recall insertion failed:", error.message)
    }
    
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase().catch(console.error)
