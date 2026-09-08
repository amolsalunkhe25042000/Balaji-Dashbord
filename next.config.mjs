const isProductionArtifact =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-production-server";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Keep dev hot-reload chunks separate from build/start output.
  distDir: isProductionArtifact ? ".next-build" : ".next-dev",
};

export default nextConfig;
