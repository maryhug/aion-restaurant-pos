import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",  ← elimina o comenta esta línea
  serverExternalPackages: ["@prisma/client", "bcrypt"],
};

export default nextConfig;