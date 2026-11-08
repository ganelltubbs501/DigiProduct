import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files that must be loaded from node_modules, not bundled.
  serverExternalPackages: ["stripe", "@electric-sql/pglite", "postgres"],
};

export default nextConfig;
