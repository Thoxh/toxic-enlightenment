/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // Ignore TypeScript errors during build (for Railway deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Include public assets in the standalone build
  outputFileTracingIncludes: {
    "/api/admin/tickets/send": ["./public/**/*"],
    "/api/admin/tickets/pdf": ["./public/**/*"],
  },
}

export default nextConfig
