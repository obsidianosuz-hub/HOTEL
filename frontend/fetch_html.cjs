const https = require('https');
https.get('https://itcloude.uz/?v=4', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data));
});
