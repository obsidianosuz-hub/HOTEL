const { Client } = require('ssh2');
const conn = new Client();

const cmd = 'cd /home/itcloud/hotel_erp_app/backend && npm install && cd ../frontend && npm install && npm run build';
console.log('Running:', cmd);

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Command closed with code:', code);
      
      // Start the server
      const startCmd = 'cd /home/itcloud/hotel_erp_app/backend && pm2 start src/index.js --name "hotel-erp-backend" || pm2 restart hotel-erp-backend';
      console.log('Starting backend...');
      conn.exec(startCmd, (err2, stream2) => {
        if(err2) throw err2;
        stream2.on('close', () => {
          conn.end();
        }).on('data', (d) => process.stdout.write(d)).stderr.on('data', (d) => process.stderr.write(d));
      });
      
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
