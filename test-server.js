const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/',
  method: 'GET'
};

console.log('Testando conexão com o servidor...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log('Recebendo dados do servidor');
  });
  
  res.on('end', () => {
    console.log('Conexão bem-sucedida!');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problema na conexão: ${e.message}`);
  process.exit(1);
});

req.end(); 