const http = require('http');

http.get('http://100.92.238.113:5001/api/public/hotel-info', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', console.error);
