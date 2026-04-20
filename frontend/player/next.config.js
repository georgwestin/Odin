/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.mint.io",
      },
      {
        protocol: "https",
        hostname: "winna.imgix.net",
      },
    ],
  },
};

module.exports = nextConfig;
