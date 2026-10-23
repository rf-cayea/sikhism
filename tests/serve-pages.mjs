// Test-only static hosting at the actual GitHub project path. Deliberately no
// SPA fallback or API routes: missing absolute assets must fail these tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://local').pathname;
  if (!path.startsWith('/sikhism/')) return res.writeHead(404).end();
  try {
    const relative = decodeURIComponent(path.slice('/sikhism/'.length)) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(resolve(root) + sep)) return res.writeHead(404).end();
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(content);
  } catch { res.writeHead(404).end(); }
}).listen(3100, '127.0.0.1');
