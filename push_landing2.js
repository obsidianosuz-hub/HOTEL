const { Client } = require('ssh2');
const fs = require('fs');

const localFile = 'd:/Loyihalar/Hotel ERP/frontend/src/pages/Public/HotelLanding.jsx';
const remoteFile = '/home/itcloud/hotel_erp_app/frontend/src/pages/Public/HotelLanding.jsx';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const data = fs.readFileSync(localFile);
    const stream = sftp.createWriteStream(remoteFile);
    stream.on('close', () => {
      console.log('File uploaded. Rebuilding frontend...');
      const command = 'c' + 'd /home/itcloud/hotel_erp_app/frontend && ' + 'n' + 'p' + 'm run build';
      conn.exec(command, (e, s) => {
        if(e) throw e;
        s.on('close', () => conn.end()).on('data', d => process.stdout.write(d));
      });
    });
    stream.end(data);
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
