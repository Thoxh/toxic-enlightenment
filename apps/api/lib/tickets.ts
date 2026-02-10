import type { Prisma } from "@prisma/client"
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

  // Get all existing ticket codes
  const allTickets = await client.ticket.findMany({
    select: { code: true },
  })

  // Find the highest sequential number from codes ending with -XXX pattern
  let maxNumber = 0
  const pattern = /-(\d{3})$/
  
  for (const ticket of allTickets) {
    const match = ticket.code.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num
      }
    }
  }

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
