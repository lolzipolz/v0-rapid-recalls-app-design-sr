import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { neon } from "@neondatabase/serverless"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sql = neon(process.env.DATABASE_URL)

async function runMigrations() {
  try {
    console.log("🚀 Running database migrations...")

    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Check which migrations have been run
    const executedMigrations = await sql`
      SELECT filename FROM migrations ORDER BY id
    `

    const executedFiles = executedMigrations.map((m) => m.filename)

    // Run initial schema migration if not executed
    const migrationFile = "001_initial_schema.sql"

    if (!executedFiles.includes(migrationFile)) {
      console.log(`📄 Running migration: ${migrationFile}`)

      const migrationPath = join(__dirname, "..", "migrations", migrationFile)
      const migrationSQL = readFileSync(migrationPath, "utf-8")

      await sql.transaction(async (tx) => {
        await tx.unsafe(migrationSQL)
        await tx`INSERT INTO migrations (filename) VALUES (${migrationFile})`
      })

      console.log(`✅ Migration ${migrationFile} completed`)
    } else {
      console.log(`⏭️  Migration ${migrationFile} already executed`)
    }

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runMigrations()
