const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const publicDir = 'showcase-web';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log('🎾 Tennis Club RT2 Showcase Server');
  console.log('=================================');
  console.log(`🌐 Server running at: http://localhost:${port}`);
  console.log('📁 Serving files from: ' + publicDir);
  console.log('✨ Your showcase is ready to view!');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  
  // Try to open browser (Windows)
  const { exec } = require('child_process');
  exec(`start http://localhost:${port}`, (err) => {
    if (err) {
      console.log('💡 Open your browser and navigate to: http://localhost:8080');
    }
  });
});