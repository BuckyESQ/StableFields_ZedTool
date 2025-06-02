import { createProxyMiddleware } from 'http-proxy-middleware';
// disable Next's default body parser so proxy can stream
export const config = { api: { bodyParser: false } };

const apiProxy = createProxyMiddleware({
  target: 'https://api.zedchampions.com',
  changeOrigin: true,
  pathRewrite: { '^/api/zed': '' },
  logLevel: 'debug',
  secure: false,
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Authorization', `Bearer ${process.env.ZED_TOKEN}`);
  }
});

export default function handler(req, res) {
  return apiProxy(req, res, (err) => {
    if (err) {
      console.error('🚨 Proxy error:', err);
      res.status(502).end('Bad gateway');
    }
  });
}