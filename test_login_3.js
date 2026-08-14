const http = require('http');

const data = JSON.stringify({
  booking_code: "BKG-2026-63F91A",
  full_name: "Overlap Guest B"
});

const options = {
  hostname: '172.23.122.184',
  port: 5001,
  path: '/api/guest/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', error => console.error('Error:', error.message));
req.write(data);
req.end();
