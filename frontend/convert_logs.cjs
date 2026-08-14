const fs = require('fs');
try {
  const out = fs.readFileSync('build_out.txt', 'utf16le');
  fs.writeFileSync('build_out_utf8.txt', out, 'utf8');
} catch(e) {}
try {
  const err = fs.readFileSync('build_err.txt', 'utf16le');
  fs.writeFileSync('build_err_utf8.txt', err, 'utf8');
} catch(e) {}
