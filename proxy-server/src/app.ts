import express from 'express';
import { createImageRoutes } from './routes/imageRoutes.js';

type AppOptions = {
  host: string;
  port: number;
  cacheDir: string | null;
};

export function createApp({ host, port, cacheDir }: AppOptions) {
  const app = express();

  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/ready', (_req, res) => {
    res.status(200).json({
      status: 'ready',
      fileSystemCacheEnabled: cacheDir !== null,
      cacheDir,
    });
  });

  app.use('/v1', createImageRoutes({ cacheDir }));

  return app;
}
