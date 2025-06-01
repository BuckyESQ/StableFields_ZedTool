import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

app.use(
  '/zed',
  createProxyMiddleware({
    target: 'https://api.zedchampions.com',
    changeOrigin: true,
    pathRewrite: { '^/zed': '' },
    onProxyReq: proxyReq => {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.ZED_TOKEN}`);
    }
  })
);

const PORT = 3000;
app.listen(PORT, () => console.log(`🔄 Proxy up at http://localhost:${PORT}`));