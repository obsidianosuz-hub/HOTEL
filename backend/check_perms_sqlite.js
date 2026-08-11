const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dev.db');
db.all("SELECT p.*, r.name FROM Permission p JOIN Role r ON p.role_id = r.id WHERE r.name = 'Procurement'", (err, rows) => {
  const fs = require('fs');
  fs.writeFileSync('perms_sqlite.json', JSON.stringify(rows, null, 2));
});
