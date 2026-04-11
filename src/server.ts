import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track content length for large requests
async function checkBodySize(req: IncomingMessage): Promise<{ allowed: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!req.headers['content-length']) {
      resolve({ allowed: true });
      return;
    }
    
    const contentLength = parseInt(req.headers['content-length'] as string, 10);
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    if (contentLength > maxSize) {
      resolve({ 
        allowed: false, 
        error: `Request body too large: ${contentLength} bytes (max: ${maxSize})` 
      });
    } else {
      resolve({ allowed: true });
    }
  });
}

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Check body size for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        const check = await checkBodySize(req);
        if (!check.allowed) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: check.error }));
          return;
        }
      }
      
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });
  
  // Configure server for large uploads
  server.maxHeadersSize = 100 * 1024; // 100KB headers
  server.headersTimeout = 120 * 1000; // 120 seconds timeout
  
  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
  
  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
    console.log('> Max upload size: 500MB');
  });
});
