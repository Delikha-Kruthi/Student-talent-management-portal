import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './src/backend/routes.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to reliably locate the compiled frontend distribution directory
function resolveDistPath(): string {
  // 1. When running from dist/server.js, index.html is in the same directory (__dirname)
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    return __dirname;
  }
  // 2. When running from project root (server.ts / server.js), dist is a subdirectory of cwd
  const cwdDist = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(path.join(cwdDist, 'index.html'))) {
    return cwdDist;
  }
  // 3. Fallback to __dirname/dist
  const localDist = path.resolve(__dirname, 'dist');
  if (fs.existsSync(path.join(localDist, 'index.html'))) {
    return localDist;
  }
  return cwdDist;
}

// Helper to reliably locate the uploads directory
function resolveUploadsDir(): string {
  const cwdUploads = path.resolve(process.cwd(), 'uploads');
  if (fs.existsSync(cwdUploads)) return cwdUploads;

  const localUploads = path.resolve(__dirname, 'uploads');
  if (fs.existsSync(localUploads)) return localUploads;

  const parentUploads = path.resolve(__dirname, '..', 'uploads');
  if (fs.existsSync(parentUploads)) return parentUploads;

  return cwdUploads;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = '0.0.0.0';

  // Determine production vs development:
  // Running the compiled bundle (dist/server.js) or having NODE_ENV=production means production
  const isRunningCompiled =
    __filename.endsWith('dist/server.js') ||
    __filename.endsWith('dist\\server.js') ||
    path.basename(__dirname) === 'dist';
  const isProd = process.env.NODE_ENV === 'production' || isRunningCompiled;

  const distPath = resolveDistPath();
  const uploadsDir = resolveUploadsDir();
  const videosDir = path.join(uploadsDir, 'videos');
  const docsDir = path.join(uploadsDir, 'docs');

  // Trust reverse proxy headers (e.g. Google Cloud Run, AI Studio proxy)
  app.set('trust proxy', 1);

  // Safe HTTP Request Logging Middleware (logs method, path, status, and duration; no secrets)
  app.use((req, res, next) => {
    const startTime = Date.now();
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms) [IP: ${clientIp}]`);
    });

    next();
  });

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure uploads directories exist
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // Explicit Video Streaming with HTTP 206 Partial Content
  const streamVideo = (req: express.Request, res: express.Response) => {
    const filePath = path.join(videosDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Video not found');
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.webm' ? 'video/webm' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  };

  app.get('/uploads/videos/:filename', streamVideo);
  app.get('/api/uploads/videos/:filename', streamVideo);

  // Serve static docs
  app.use('/uploads/docs', express.static(docsDir));

  // Health check endpoint for container platform routing and load balancers
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'ALWAR POLYTECHNIC – Student Talent Management Portal',
      mode: isProd ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  // Mount API router FIRST before Vite/static middlewares to guarantee pure JSON responses
  app.use('/api', apiRouter);

  // Catch unmatched API routes - strictly return JSON 404, NEVER HTML
  app.all('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API route not found' });
  });
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ success: false, error: 'API route not found' });
  });

  if (!isProd) {
    // Development mode: Vite middleware
    console.log('[STARTUP] Starting in development mode with Vite middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist files
    console.log(`[STARTUP] Starting in production mode. Static assets directory: ${distPath}`);

    // Serve static files from dist
    app.use(express.static(distPath, {
      maxAge: '1d',
      index: false
    }));

    // Prevent SPA fallback for missing static assets (images, js, css, etc.)
    app.use((req, res, next) => {
      if (
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/public/') ||
        req.path.match(/\.(js|mjs|cjs|css|json|ico|png|jpg|jpeg|svg|webp|gif|woff|woff2|ttf|eot|map|mp4|webm)$/i)
      ) {
        return res.status(404).send('Static asset not found');
      }
      next();
    });

    // SPA fallback: Serve index.html for all GET routes
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Application build missing. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`[ALWAR POLYTECHNIC PORTAL] Server Online`);
    console.log(`• Effective Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`• Listening on: http://${HOST}:${PORT}`);
    console.log(`• Dist Directory: ${distPath}`);
    console.log(`• index.html Found: ${fs.existsSync(path.join(distPath, 'index.html'))}`);
    console.log(`• Uploads Directory: ${uploadsDir}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
