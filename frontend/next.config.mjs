/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Type-checking still runs during `next build`; ESLint is not part of this project's toolchain.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
