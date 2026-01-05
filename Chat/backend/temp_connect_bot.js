
import http from 'http';

const data = JSON.stringify({
  host: 'localhost',
  port: 19987,
  username: 'LiraBot'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/gamer/v2/connect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error.message);
});

req.write(data);
req.end();
