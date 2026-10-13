import type { NextConfig } from "next";

// Env comes from the repo-root .env, loaded by `dotenv run` in the package scripts.
const nextConfig: NextConfig = {
  transpilePackages: ["@moozer/db"],
  // Type-check builds without .next/dev/types: those belong to a running
  // `next dev` and go stale when a route is deleted.
  typescript: { tsconfigPath: "tsconfig.typecheck.json" },
};

export default nextConfig;
