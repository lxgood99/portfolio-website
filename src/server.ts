import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });
  
  // Configure server for large uploads
  server.maxHeadersSize = 8 * 1024 * 1024; // 8MB headers (increased for large uploads)
  server.timeout = 300 * 1000; // 5 minutes timeout
  
  server.on('clientError', (err, socket) => {
    console.error('Client error:', err.message);
    if (socket.writable) {
      socket.end('HTTP/1.1 413 Payload Too Large\r\n\r\n');
    }
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
