const https = require('https');
https.get('https://itcloude.uz/assets/index-DEuvyxjn.js', (res) => {
  console.log('STATUS:', res.statusCode);
});
