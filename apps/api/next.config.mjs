import { config } from "dotenv"
import { resolve } from "path"

// Load root .env file for monorepo
config({ path: resolve(process.cwd(), "../../.env") })

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // Include public assets in the standalone build for Vercel
  outputFileTracingIncludes: {
    "/api/admin/tickets/send": ["./public/**/*"],
    "/api/admin/tickets/pdf": ["./public/**/*"],
  },
}

export default nextConfig
