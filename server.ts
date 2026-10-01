import fs from 'fs';
import path from 'path';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

// In Cloud Run (K_SERVICE is set) or production, run the compiled bundle if available.
// Only fallback to dev server if DEV_MODE is explicitly set and not in Cloud Run.
const isDev = process.env.DEV_MODE === 'true' && !process.env.K_SERVICE;

if (fs.existsSync(distServer) && !isDev) {
  await import(distServer);
} else {
  await import('./server/app.ts');
}
