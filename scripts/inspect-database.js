#!/usr/bin/env node

import { sql } from "../lib/database.js"

async function inspectDatabase() {
  console.log("🔍 Inspecting Database Schema...")
  console.log("=" * 50)
  
  try {
    // Test connection
    console.log("1. Testing database connection...")
    const testResult = await sql`SELECT 1 as test`
    console.log("✅ Connection successful")
    console.log("")
    
    // Get all tables
    console.log("2. All tables in database:")
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log("❌ No tables found!")
      return
    }
    
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`)
    })
    console.log("")
    
    // Inspect each table in detail
    for (const table of tables) {
      console.log(`3. Table: ${table.table_name}`)
      console.log("-" * 30)
      
      // Get column information
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = ${table.table_name}
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      
      console.log("Columns:")
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
        console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`)
      })
      
      // Get indexes
      const indexes = await sql`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = ${table.table_name}
        ORDER BY indexname
      `
      
      if (indexes.length > 0) {
        console.log("Indexes:")
        indexes.forEach(idx => {
          console.log(`  - ${idx.indexname}`)
        })
      }
      
      // Get row count
      const rowCount = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`
      console.log(`Row count: ${rowCount[0].count}`)
      
      console.log("")
    }
    
    // Check for specific expected tables
    console.log("4. Expected vs Actual Tables:")
    const expectedTables = ['users', 'products', 'recalls', 'matched_recalls']
    const actualTables = tables.map(t => t.table_name)
    
    expectedTables.forEach(expected => {
      const exists = actualTables.includes(expected)
      console.log(`  ${exists ? '✅' : '❌'} ${expected}`)
    })
    
    // Check for specific expected columns in recalls table
    if (actualTables.includes('recalls')) {
      console.log("\n5. Recalls table column check:")
      const recallsColumns = await sql`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'recalls'
        AND table_schema = 'public'
      `
      const columnNames = recallsColumns.map(c => c.column_name)
      
      const expectedColumns = [
        'id', 'external_id', 'title', 'description', 'agency', 
        'severity', 'recall_date', 'link', 'product_keywords', 
        'brand_keywords', 'upc_codes', 'created_at', 'updated_at'
      ]
      
      expectedColumns.forEach(expected => {
        const exists = columnNames.includes(expected)
        console.log(`  ${exists ? '✅' : '❌'} ${expected}`)
      })
    }
    
    // Show sample data if any exists
    console.log("\n6. Sample Data:")
    for (const table of tables) {
      const sampleData = await sql`SELECT * FROM ${sql(table.table_name)} LIMIT 3`
      if (sampleData.length > 0) {
        console.log(`\n${table.table_name} (${sampleData.length} rows):`)
        sampleData.forEach((row, i) => {
          console.log(`  Row ${i + 1}:`, JSON.stringify(row, null, 2))
        })
      } else {
        console.log(`\n${table.table_name}: No data`)
      }
    }
    
  } catch (error) {
    console.error("❌ Database inspection failed:", error.message)
    console.error("Stack:", error.stack)
  }
}

async function createMissingTables() {
  console.log("\n🔧 Creating missing tables...")
  
  try {
    // Check if tables exist and create them if missing
    const { initializeDatabase } = await import("../lib/database.js")
    await initializeDatabase()
    console.log("✅ Database initialization completed")
    
  } catch (error) {
    console.error("❌ Failed to create missing tables:", error.message)
  }
}

async function main() {
  await inspectDatabase()
  await createMissingTables()
  console.log("\n✅ Database inspection completed!")
}

main().catch(console.error) 