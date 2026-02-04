import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: Pool
}

const globalForPrisma = globalThis as PrismaGlobal

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Missing DATABASE_URL")
}

const pool = globalForPrisma.pgPool ?? new Pool({ connectionString })

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pgPool = pool
}
