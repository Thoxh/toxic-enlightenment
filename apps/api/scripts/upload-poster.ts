/**
 * One-time script to upload the poster image to Vercel Blob
 * Run with: npx tsx scripts/upload-poster.ts
 */

import { config } from "dotenv"
import { put } from "@vercel/blob"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from monorepo root
config({ path: path.join(__dirname, "../../../.env") })

async function uploadPoster() {
  const posterPath = path.join(__dirname, "../public/poster.jpg")
  
  if (!fs.existsSync(posterPath)) {
    console.error("❌ Poster not found at:", posterPath)
    process.exit(1)
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ BLOB_READ_WRITE_TOKEN not set!")
    console.log("Run: vercel env pull")
    process.exit(1)
  }

  console.log("📤 Uploading poster.jpg to Vercel Blob...")

  const fileBuffer = fs.readFileSync(posterPath)
  
  const blob = await put("toxic-enlightenment/poster.jpg", fileBuffer, {
    access: "public",
    contentType: "image/jpeg",
  })

  console.log("✅ Upload successful!")
  console.log("")
  console.log("🔗 Blob URL:", blob.url)
  console.log("")
  console.log("Add this to your .env:")
  console.log(`POSTER_URL=${blob.url}`)
}

uploadPoster().catch(console.error)
