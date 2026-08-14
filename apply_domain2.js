const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    "echo clone1997 | su" + "do -S sed -i 's/server_name erp.obsidian-os.uz hotel.obsidian-os.uz;/server_name itclode.uz www.itclode.uz;/g' /etc/nginx/sites-available/hotel-erp",
    "echo clone1997 | su" + "do -S nginx -t",
    "echo clone1997 | su" + "do -S systemctl reload nginx"
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Update completed with code', code);
      conn.end();
    })
    .on('data', d => process.stdout.write(d))
    .stderr.on('data', d => process.stderr.write(d));
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
