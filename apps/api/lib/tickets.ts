import { Prisma } from "@prisma/client"
import { randomBytes } from "crypto"
import { prisma } from "./prisma"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding similar chars like 0/O, 1/I/L

/**
 * Generates a random alphanumeric code (8 characters)
 */
function generateRandomCode(): string {
  const bytes = randomBytes(8)
  let code = ""

  for (let i = 0; i < 8; i += 1) {
    const index = bytes[i] % ALPHABET.length
    code += ALPHABET[index]
  }

  return code
}

/**
 * Generates a ticket code with format: RANDOM-XXX
 * Where RANDOM is an 8-character alphanumeric code and XXX is a sequential three-digit number
 * Works with both regular Prisma client and transaction client
 */
export async function generateTicketCode(
  tx?: Prisma.TransactionClient
): Promise<string> {
  const client = tx || prisma

  // Use raw SQL to efficiently find the maximum sequential number
  // This is much faster than fetching all tickets and processing in JavaScript
  // Transaction clients support $queryRaw
  type QueryResult = Array<{ max_num: bigint | null }>
  const result = await (client as any).$queryRaw<QueryResult>`
    SELECT MAX(
      CAST(
        SUBSTRING(code FROM '-(\\d{3})$') AS INTEGER
      )
    ) as max_num
    FROM "Ticket"
    WHERE code ~ '-\\d{3}$'
  `

  // Extract max number (will be null if no tickets exist or none match pattern)
  const maxNumber = result && result[0] && result[0].max_num != null ? Number(result[0].max_num) : 0

  // Increment and format as three-digit string
  const nextNumber = maxNumber + 1
  const sequentialPart = nextNumber.toString().padStart(3, "0")

  // Ensure we don't exceed 999
  if (nextNumber > 999) {
    throw new Error("Maximum ticket code sequence (999) reached")
  }

  // Generate random prefix and combine with sequential number
  const randomPart = generateRandomCode()
  const code = `${randomPart}-${sequentialPart}`

  return code
}
