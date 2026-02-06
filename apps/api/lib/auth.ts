/**
 * API Authentication & Authorization
 * 
 * All admin endpoints require:
 * 1. ADMIN_API_KEY to be set in environment
 * 2. Request must include x-admin-key header matching ADMIN_API_KEY
 * 3. Request must come from allowed origins (CORS)
 */

const ALLOWED_ORIGINS = [
  "https://app.soundkioskevents.de",
  "https://www.app.soundkioskevents.de",
]

// Allow localhost in development
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:3000")
  ALLOWED_ORIGINS.push("http://localhost:5000")
}

export interface AuthResult {
  authorized: boolean
  error?: string
  corsHeaders: HeadersInit
}

/**
 * Validates admin API requests
 * - Checks ADMIN_API_KEY is configured
 * - Validates x-admin-key header
 * - Validates Origin header (CORS)
 */
export function validateAdminRequest(request: Request): AuthResult {
  const origin = request.headers.get("origin") || ""
  
  // CORS headers - always include
  const corsHeaders: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Max-Age": "86400",
  }
  
  // Set specific origin if allowed, otherwise don't set (browser will block)
  if (ALLOWED_ORIGINS.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin
  }

  // Check if ADMIN_API_KEY is configured
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) {
    console.error("[Auth] ADMIN_API_KEY is not configured!")
    return {
      authorized: false,
      error: "Server misconfiguration: ADMIN_API_KEY not set",
      corsHeaders,
    }
  }

  // Validate API key
  const providedKey = request.headers.get("x-admin-key")
  if (!providedKey || providedKey !== adminKey) {
    return {
      authorized: false,
      error: "Unauthorized: Invalid or missing API key",
      corsHeaders,
    }
  }

  // Validate origin (skip for non-browser requests like server-to-server)
  // Origin header is only sent by browsers
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return {
      authorized: false,
      error: "Unauthorized: Origin not allowed",
      corsHeaders,
    }
  }

  return {
    authorized: true,
    corsHeaders,
  }
}

/**
 * Creates an unauthorized response with proper CORS headers
 */
export function unauthorizedResponse(error: string, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify({ error }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  })
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreflightResponse(request: Request): Response {
  const origin = request.headers.get("origin") || ""
  
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Max-Age": "86400",
  }
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  
  return new Response(null, { status: 204, headers })
}
