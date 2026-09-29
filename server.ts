import fs from 'fs';
import path from 'path';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

if (process.env.NODE_ENV === 'production' && fs.existsSync(distServer)) {
  await import(distServer);
} else {
  await import('./server/app.ts');
}
