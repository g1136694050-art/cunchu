const http = require('http')
const data = JSON.stringify({ username: '123', password: '123' })
const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = ''
    res.on('data', (c) => (body += c))
    res.on('end', () => console.log(res.statusCode, body))
  },
)
req.write(data)
req.end()
