const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  res.on('data', (chunk) => {
  });
  
  res.on('end', () => {
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problema na conexão: ${e.message}`);
  process.exit(1);
});

req.end(); 