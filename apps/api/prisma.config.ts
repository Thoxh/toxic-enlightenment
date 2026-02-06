import { defineConfig, env } from "prisma/config"
import { config } from "dotenv"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load local .env file for development (Railway sets ENV vars directly)
if (!process.env.DATABASE_URL) {
  config({ path: resolve(__dirname, ".env") })
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
})
