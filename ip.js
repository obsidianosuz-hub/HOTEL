const os = require('os');
const networkInterfaces = os.networkInterfaces();
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const info of interfaces) {
    if (info.family === 'IPv4' && !info.internal) {
      console.log(`${interfaceName}: ${info.address}`);
    }
  }
}
