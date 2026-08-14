const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /etc/nginx/sites-available/', (err, stream) => {
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d));
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
