const { Client } = require('ssh2');
const fs = require('fs');

const localZip = 'd:\\Loyihalar\\Hotel ERP\\frontend\\dist.zip';
const remoteZip = '/home/itcloud/hotel_erp_app/frontend/dist.zip';
const remoteDist = '/home/itcloud/hotel_erp_app/frontend/dist';

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading zip...');
    sftp.fastPut(localZip, remoteZip, (err) => {
      if (err) throw err;
      console.log('Upload finished! Unzipping...');
      
      // Now unzip it
      conn.exec(`cd /home/itcloud/hotel_erp_app/frontend && rm -rf dist && unzip dist.zip -d dist`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('Unzip finished!');
          conn.end();
        }).on('data', d => console.log(d.toString()))
          .stderr.on('data', d => console.error(d.toString()));
      });
    });
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
