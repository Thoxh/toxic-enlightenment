import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

const adminEmail = process.env.ADMIN_EMAIL ?? ""
const adminPasswordHashRaw = process.env.ADMIN_PASSWORD_HASH ?? ""
const adminPasswordHashB64 = process.env.ADMIN_PASSWORD_HASH_B64 ?? ""
const adminPasswordHashDecoded = adminPasswordHashB64
  ? Buffer.from(adminPasswordHashB64, "base64").toString("utf8")
  : ""
const adminPasswordHash =
  adminPasswordHashRaw || adminPasswordHashDecoded || ""
const normalizedAdminPasswordHash = adminPasswordHash.replace(/\\\$/g, "$")

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        if (!adminEmail || !normalizedAdminPasswordHash) {
          return null
        }

        const emailMatches =
          credentials.email.trim().toLowerCase() ===
          adminEmail.trim().toLowerCase()

        if (!emailMatches) {
          return null
        }

        const passwordMatches = await compare(
          credentials.password,
          normalizedAdminPasswordHash,
        )

        if (!passwordMatches) {
          return null
        }

        return {
          id: "admin",
          name: "Admin",
          email: adminEmail,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
