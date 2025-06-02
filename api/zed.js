import { createProxyMiddleware } from 'http-proxy-middleware';

export default createProxyMiddleware({
  target: 'https://api.zedchampions.com',
  changeOrigin: true,
  pathRewrite: { '^/api/zed': '' },
  onProxyReq(proxyReq) {
    proxyReq.setHeader('Authorization', `Bearer ${process.env.ZED_TOKEN}`);
  }
});