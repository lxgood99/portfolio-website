import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

const MAX_BODY_SIZE = 500 * 1024 * 1024; // 500MB

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Log all requests
      console.log(`${req.method} ${req.url}`);
      
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', req.url, err);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });

  server.maxHeadersSize = 16 * 1024 * 1024;
  server.timeout = 600 * 1000;

  server.listen(port, () => {
    console.log(`> Server at http://${hostname}:${port} as ${dev ? 'development' : 'production'}`);
    console.log(`> Max upload: ${MAX_BODY_SIZE / 1024 / 1024}MB`);
  });
});
