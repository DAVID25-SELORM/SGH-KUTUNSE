import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.satellitegeneralhospital.com" }],
        destination: "https://satellitegeneralhospital.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
