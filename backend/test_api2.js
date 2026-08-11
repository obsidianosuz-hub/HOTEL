const http = require('http');

const data = JSON.stringify({ booking_code: 'BKG-2026-59DDE3', full_name: 'Test Guest One' });

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/guest/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error('Request Error:', error.message);
});

req.write(data);
req.end();
