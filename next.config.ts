import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build the whole site into plain files in /out: no server, no database.
  output: "export",
  // The default image optimizer needs a server; our images are pre-optimised.
  images: { unoptimized: true },
  env: {
    // Shown in save files and the debug report.
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "dev",
  },
};

export default nextConfig;
