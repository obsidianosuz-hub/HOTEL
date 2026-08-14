const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = "curl -H 'Host: itcloude.uz' -I http://127.0.0.1:8080";
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => { conn.end(); })
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
  });
}).connect({ host: '100.92.238.113', port: 22, username: 'itcloud', password: 'clone1997' });
