import localtunnel from 'localtunnel';
import fs from 'fs';

const tunnel = await localtunnel({ port: 3000 });
console.log('TUNNEL_URL:' + tunnel.url);
fs.writeFileSync('tunnel-url.txt', tunnel.url);

tunnel.on('close', () => {
  console.log('Tunnel closed');
  process.exit(0);
});

// Keep alive
setInterval(() => {}, 60000);
