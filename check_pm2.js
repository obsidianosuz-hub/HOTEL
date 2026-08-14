const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("pm2 status && pm2 logs hotel-erp-backend --lines 20 --nostream", (err, stream) => {
    if (err) throw err;
    stream.on('close', () => { conn.end(); })
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
