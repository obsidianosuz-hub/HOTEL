const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 6, roleId: 7, roleName: 'Procurement' }, 'hotel-erp-staff-secret-key-2026', { expiresIn: '1h' });

fetch('http://localhost:5001/api/procurement/purchase-orders', {
  headers: { Authorization: `Bearer ${token}` }
}).then(async res => {
  console.log('STATUS:', res.status);
  console.log('BODY:', await res.text());
}).catch(err => {
  console.error('ERROR:', err);
});
