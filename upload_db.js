const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localDbPath = 'd:\\\\Loyihalar\\\\Hotel ERP\\\\backend\\\\prisma\\\\dev.db';
const remoteDbPath = '/home/itcloud/hotel_erp_app/backend/prisma/dev.db';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading dev.db...');
    
    // Create prisma dir if not exists
    conn.exec('mkdir -p /home/itcloud/hotel_erp_app/backend/prisma', (err2, stream) => {
      stream.on('close', () => {
        sftp.fastPut(localDbPath, remoteDbPath, (err3) => {
          if (err3) throw err3;
          console.log('dev.db uploaded successfully.');
          
          conn.exec('cd /home/itcloud/hotel_erp_app/backend && npx prisma generate && pm2 restart hotel-erp-backend', (err4, stream2) => {
            if (err4) throw err4;
            stream2.on('close', () => conn.end())
                   .on('data', d => process.stdout.write(d))
                   .stderr.on('data', d => process.stderr.write(d));
          });
        });
      });
    });
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
