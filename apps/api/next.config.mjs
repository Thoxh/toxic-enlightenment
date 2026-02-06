/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // Include public assets in the standalone build
  outputFileTracingIncludes: {
    "/api/admin/tickets/send": ["./public/**/*"],
    "/api/admin/tickets/pdf": ["./public/**/*"],
  },
}

export default nextConfig
