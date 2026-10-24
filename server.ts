import fs from 'fs';
import path from 'path';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');
const distIndex = path.join(process.cwd(), 'dist', 'index.html');

const isDev =
  process.env.DEV_MODE === 'true' ||
  process.env.npm_lifecycle_event === 'dev' ||
  !fs.existsSync(distIndex);

if (!isDev && fs.existsSync(distServer)) {
  await import(distServer);
} else {
  await import('./server/app.ts');
}
