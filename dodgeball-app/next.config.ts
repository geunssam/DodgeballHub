import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 프로덕션 빌드 시 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 프로덕션 빌드 시 TypeScript 에러 무시 (선택사항)
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

export default nextConfig;
