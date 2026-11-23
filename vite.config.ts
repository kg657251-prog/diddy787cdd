import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-handler',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              try {
                const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
                let body: any = undefined;
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                  const buffers: Buffer[] = [];
                  for await (const chunk of req) {
                    buffers.push(chunk);
                  }
                  body = Buffer.concat(buffers).toString();
                }

                if (url.pathname === '/api/verify-player') {
                  const handler = (await import('./api/verify-player.ts')).default;
                  const webReq = new Request(url.href, {
                    method: req.method,
                    headers: req.headers as Record<string, string>,
                    body: body,
                  });
                  const webRes = await handler(webReq);
                  res.statusCode = webRes.status;
                  webRes.headers.forEach((value, key) => {
                    res.setHeader(key, value);
                  });
                  const resText = await webRes.text();
                  return res.end(resText);
                }

                if (url.pathname === '/api/create-payment') {
                  const handler = (await import('./api/create-payment.ts')).default;
                  const webReq = new Request(url.href, {
                    method: req.method,
                    headers: req.headers as Record<string, string>,
                    body: body,
                  });
                  const webRes = await handler(webReq);
                  res.statusCode = webRes.status;
                  webRes.headers.forEach((value, key) => {
                    res.setHeader(key, value);
                  });
                  const resText = await webRes.text();
                  return res.end(resText);
                }
              } catch (err: any) {
                console.error('[local-api-handler error]', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            }
            next();
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
