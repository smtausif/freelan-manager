/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: { ignoreDuringBuilds: true },     // skip ESLint in prod builds
    typescript: { ignoreBuildErrors: true },  // skip TS type errors in prod builds
  };
  
  export default nextConfig;