const { Client } = require('ssh2');
const conn = new Client();
const cmd = 'cd /home/itcloud/hotel_erp_app && git init && git remote add origin https://github.com/obsidianosuz-hub/HOTEL.git || true && git fetch --all && git reset --hard origin/main && cd frontend && npm install && npm run build && cd ../backend && npm install && pm2 restart hotel-erp-backend';
console.log('Running:', cmd);

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Command closed with code:', code);
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
