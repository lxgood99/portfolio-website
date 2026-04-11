import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // API route body 大小限制（支持最大 500MB 文件上传）
  experimental: {
    largePageDataBytes: 500 * 1024 * 1024, // 500MB
  },
  // 增加 API 路由的 body 大小限制
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

export default nextConfig;
