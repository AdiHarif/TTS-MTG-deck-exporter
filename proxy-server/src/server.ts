import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

function parsePort(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535) return parsed;
  return 8787;
}

function parseCacheDir(value: string | undefined, serverDir: string): string | null {
  if (value == null) return path.resolve(serverDir, '..', './cache');

  const trimmed = value.trim();
  if (!trimmed) return null;

  return path.resolve(serverDir, '..', trimmed);
}

const host = process.env.HOST && process.env.HOST.trim() ? process.env.HOST : '0.0.0.0';
const port = parsePort(process.env.PORT);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = parseCacheDir(process.env.CACHE_DIR, serverDir);

if (cacheDir) {
  await fs.mkdir(cacheDir, { recursive: true });
}

const app = createApp({ host, port, cacheDir });

const server = app.listen(port, host, () => {
  console.log(
    JSON.stringify({
      msg: 'proxy server started',
      host,
      port,
      cacheDir,
      fileSystemCacheEnabled: cacheDir !== null,
    })
  );
});

function shutdown(signal: string) {
  console.log(JSON.stringify({ msg: 'shutdown signal received', signal }));
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
