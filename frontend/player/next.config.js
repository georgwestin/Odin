/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.mint.io",
      },
    ],
  },
};

module.exports = nextConfig;
