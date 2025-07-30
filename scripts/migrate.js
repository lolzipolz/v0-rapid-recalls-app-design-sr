import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { neon } from "@neondatabase/serverless"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sql = neon(process.env.DATABASE_URL)

async function runMigrations() {
  try {
    console.log("Running database migrations...")

    const migrationFile = join(__dirname, "001-initial-schema.sql")
    const migrationSQL = readFileSync(migrationFile, "utf-8")

    await sql(migrationSQL)

    console.log("Migrations completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigrations()
