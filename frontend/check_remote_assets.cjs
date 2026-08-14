const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /home/itcloud/hotel_erp_app/frontend/dist/assets', (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('close', () => {
      fs.writeFileSync('remote_assets.txt', data);
      conn.end();
    }).on('data', d => data += d).stderr.on('data', d => data += d);
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
