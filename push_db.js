const { Client } = require('ssh2');
const fs = require('fs');

const local = 'd:/Loyihalar/Hotel ERP/backend/prisma/dev.db';
const remote = '/home/itcloud/hotel_erp_app/backend/prisma/dev.db';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const data = fs.readFileSync(local);
    const stream = sftp.createWriteStream(remote);
    stream.on('close', () => {
      console.log('Done');
      conn.exec('cd /home/itcloud/hotel_erp_app/backend && npx prisma generate && pm2 restart hotel-erp-backend', (e, s) => {
        if(e) throw e;
        s.on('close', () => conn.end()).on('data', d => process.stdout.write(d));
      });
    });
    stream.end(data);
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
