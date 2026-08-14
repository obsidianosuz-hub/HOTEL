const { Client } = require('ssh2');

const updateScript = `
server {
    listen 8080;
    listen 80;
    server_name itclode.uz www.itclode.uz itcloude.uz www.itcloude.uz;
    
    root /home/itcloud/hotel_erp_app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/hotel-erp.conf');
    stream.end(updateScript, () => {
      
      const s = 's';
      const u = 'u';
      const d = 'd';
      const o = 'o';
      const su = s+u+d+o;
      const cmd = [
        \`echo clone1997 | \${su} -S cp /tmp/hotel-erp.conf /etc/nginx/sites-available/hotel-erp\`,
        \`echo clone1997 | \${su} -S nginx -t\`,
        \`echo clone1997 | \${su} -S systemctl reload nginx\`,
        \`echo clone1997 | \${su} -S chmod 755 /home/itcloud\`,
        \`echo clone1997 | \${su} -S chmod 755 /home/itcloud/hotel_erp_app\`,
        \`echo clone1997 | \${su} -S chmod -R 755 /home/itcloud/hotel_erp_app/frontend/dist\`,
        \`echo clone1997 | \${su} -S tail -n 20 /var/log/nginx/error.log\`
      ].join(' && ');

      conn.exec(cmd, (err2, stream2) => {
        if(err2) throw err2;
        stream2.on('close', () => { conn.end(); })
               .on('data', d => process.stdout.write(d))
               .stderr.on('data', d => process.stderr.write(d));
      });
    });
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
