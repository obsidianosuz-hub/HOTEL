const { exec } = require('child_process');
const fs = require('fs');

exec('npm run build', { cwd: 'd:\\Loyihalar\\Hotel ERP\\frontend', maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
  fs.writeFileSync('build_debug_stdout.txt', stdout || '');
  fs.writeFileSync('build_debug_stderr.txt', stderr || '');
  if (err) {
    fs.writeFileSync('build_debug_err.txt', err.toString());
  } else {
    fs.writeFileSync('build_debug_success.txt', 'done');
  }
});
