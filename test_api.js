fetch('https://itcloude.uz/api/guest/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({booking_code: 'BKG-2026-59DDE3', full_name: 'Test'})
}).then(r=>r.json()).then(console.log).catch(console.error);
