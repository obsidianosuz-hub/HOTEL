const fs = require('fs');
const path = require('path');
function searchFiles(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath, query);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Match found in: ${fullPath}`);
      }
    }
  }
}
searchFiles('d:\\Loyihalar\\Hotel ERP\\frontend\\src', 'nosozlik');
