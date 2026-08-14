const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIR = path.join(__dirname, 'dist');

http.createServer((req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(DIR, 'index.html');
  
  const ext = path.extname(filePath);
  const map = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
  
  res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => console.log(`Serving at http://localhost:${PORT}`));
