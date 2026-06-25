import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.resolve.alias["@prisma/client$"] = "@prisma/client/edge";
    }
    return config;
  },
};

export default nextConfig;
