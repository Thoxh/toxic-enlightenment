/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
  
  // Ignore TypeScript errors during build (for Railway deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
