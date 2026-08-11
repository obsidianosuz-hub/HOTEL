const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5001,
  path: '/api/guest-portal/my-bill',
  method: 'GET',
  timeout: 3000,
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
