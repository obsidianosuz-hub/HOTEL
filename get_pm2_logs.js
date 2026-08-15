const { Client } = require('ssh2');
const conn = new Client();
const cmd = 'cat ~/.pm2/logs/hotel-erp-backend-error.log | tail -n 100';
console.log('Running:', cmd);

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '100.92.238.113',
  port: 22,
  username: 'itcloud',
  password: 'clone1997'
});
