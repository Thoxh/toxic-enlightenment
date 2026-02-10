import { Logtail } from "@logtail/node"

const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN

// Create Logtail instance only if token is available
const logtail = sourceToken ? new Logtail(sourceToken) : null

type LogContext = Record<string, unknown>

/**
 * Logger utility for BetterStack Telemetry
 * Falls back to console logging in development or when token is missing
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    if (logtail) {
      logtail.debug(message, context)
    }
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, context ?? "")
    }
  },

  info(message: string, context?: LogContext) {
    if (logtail) {
      logtail.info(message, context)
    }
    if (process.env.NODE_ENV === "development") {
      console.info(`[INFO] ${message}`, context ?? "")
    }
  },

  warn(message: string, context?: LogContext) {
    if (logtail) {
      logtail.warn(message, context)
    }
    console.warn(`[WARN] ${message}`, context ?? "")
  },

  error(message: string, context?: LogContext) {
    if (logtail) {
      logtail.error(message, context)
    }
    console.error(`[ERROR] ${message}`, context ?? "")
  },

  /**
   * Flush pending logs - call this before the process exits or at the end of serverless function
   */
  async flush() {
    if (logtail) {
      await logtail.flush()
    }
  },
}
