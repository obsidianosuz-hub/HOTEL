const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ userId: 6, roleId: 7, roleName: 'Procurement' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/procurement/purchase-orders',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
