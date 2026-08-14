const { Client } = require('ssh2');
const fs = require('fs');

const backendEnv = `DATABASE_URL="file:./dev.db"
JWT_SECRET="hotel-erp-staff-secret-key-2026"
JWT_GUEST_SECRET="hotel-erp-guest-secret-key-2026"
ENCRYPTION_KEY="Ulo0ypmlyQjY//lhyZBOKqtq2ubhwb22DuyX/4Mv6sI="
PORT=5001
`;

const frontendEnv = `VITE_API_URL=/api
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStreamBackend = sftp.createWriteStream('/home/itcloud/hotel_erp_app/backend/.env');
    writeStreamBackend.end(backendEnv, () => {
      console.log('Backend .env written.');
      const writeStreamFrontend = sftp.createWriteStream('/home/itcloud/hotel_erp_app/frontend/.env');
      writeStreamFrontend.end(frontendEnv, () => {
        console.log('Frontend .env written.');
        
        conn.exec('cd /home/itcloud/hotel_erp_app/frontend && npm run build && pm2 restart hotel-erp-backend', (err2, stream) => {
          if (err2) throw err2;
          stream.on('close', () => conn.end())
                .on('data', d => process.stdout.write(d))
                .stderr.on('data', d => process.stderr.write(d));
        });
      });
    });
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
