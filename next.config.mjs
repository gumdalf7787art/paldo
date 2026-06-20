/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 호환성을 위해 Node.js 전용 모듈 사용 시 경고 억제용 등 설정 가능
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // 로컬 최적화 대신 브라우저 처리(또는 Cloudflare Images 등) 사용 권장
  },
};

export default nextConfig;
