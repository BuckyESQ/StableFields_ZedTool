import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

if (!process.env.ZED_TOKEN) {
  console.error('⚠️ ZED_TOKEN not set');
  process.exit(1);
}

app.use('/zed',
  createProxyMiddleware({
    target: 'https://api.zedchampions.com',
    changeOrigin: true,
    pathRewrite: { '^/zed': '' },
    logLevel: 'debug',
    secure: false,            // turn off if target has a self-signed cert
    onProxyReq: proxyReq => {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.ZED_TOKEN}`);
    },
    onError: (err, req, res) => {
      console.error('🚨 Proxy error:', err);
      res.status(502).send('Bad gateway');
    }
  })
);

const PORT = 3000;
app.listen(PORT, () => console.log(`🔄 Proxy up at http://localhost:${PORT}`));