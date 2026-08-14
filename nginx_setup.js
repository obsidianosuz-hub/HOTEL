const { Client } = require('ssh2');

const nginxConfig = `server {
    listen 8080;
    listen 80;
    server_name erp.obsidian-os.uz hotel.obsidian-os.uz;
    
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
    stream.end(nginxConfig, () => {
      console.log('Config written to /tmp/hotel-erp.conf');
      
      const cmd = `echo clone1997 | sudo -S cp /tmp/hotel-erp.conf /etc/nginx/sites-available/hotel-erp && echo clone1997 | sudo -S ln -sf /etc/nginx/sites-available/hotel-erp /etc/nginx/sites-enabled/ && echo clone1997 | sudo -S nginx -t && echo clone1997 | sudo -S systemctl reload nginx`;
      
      conn.exec(cmd, (err2, stream2) => {
        if(err2) throw err2;
        stream2.on('close', () => { conn.end(); })
               .on('data', d => process.stdout.write(d))
               .stderr.on('data', d => process.stderr.write(d));
      });
    });
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
