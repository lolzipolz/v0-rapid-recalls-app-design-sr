#!/usr/bin/env node

import { sql } from "../lib/database.js"
import fs from "fs"
import path from "path"

async function applySchema() {
  console.log("🔧 Applying database schema...")
  
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), "scripts", "generate-schema.sql")
    const schemaSQL = fs.readFileSync(schemaPath, "utf8")
    
    console.log("📄 Schema file loaded")
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        console.log(`  Executing statement ${i + 1}/${statements.length}...`)
        await sql.unsafe(statement)
        console.log(`  ✅ Statement ${i + 1} completed`)
      } catch (error) {
        console.log(`  ⚠️  Statement ${i + 1} failed (this might be expected):`, error.message)
      }
    }
    
    console.log("✅ Schema application completed")
    
    // Verify the schema was applied correctly
    console.log("\n🔍 Verifying schema...")
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'products', 'recalls', 'matched_recalls')
      ORDER BY table_name
    `
    
    const expectedTables = ['users', 'products', 'recalls', 'matched_recalls']
    const actualTables = tables.map(t => t.table_name)
    
    console.log("Tables verification:")
    expectedTables.forEach(expected => {
      const exists = actualTables.includes(expected)
      console.log(`  ${exists ? '✅' : '❌'} ${expected}`)
    })
    
    // Check recalls table columns specifically
    if (actualTables.includes('recalls')) {
      const recallsColumns = await sql`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'recalls'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      
      const expectedColumns = [
        'id', 'external_id', 'title', 'description', 'agency', 
        'severity', 'recall_date', 'link', 'product_keywords', 
        'brand_keywords', 'upc_codes', 'created_at', 'updated_at'
      ]
      
      console.log("\nRecalls table columns verification:")
      expectedColumns.forEach(expected => {
        const exists = recallsColumns.some(c => c.column_name === expected)
        console.log(`  ${exists ? '✅' : '❌'} ${expected}`)
      })
    }
    
  } catch (error) {
    console.error("❌ Schema application failed:", error.message)
    console.error("Stack:", error.stack)
  }
}

applySchema().catch(console.error) 