import { randomBytes } from "crypto"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateTicketCode(length = 12) {
  const bytes = randomBytes(length)
  let code = ""

  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % ALPHABET.length
    code += ALPHABET[index]
  }

  return code
}
