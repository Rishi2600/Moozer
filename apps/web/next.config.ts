import type { NextConfig } from "next";

// Env comes from the repo-root .env, loaded by dotenv-cli in the package scripts.
const nextConfig: NextConfig = {
  transpilePackages: ["@moozer/db"],
};

export default nextConfig;
