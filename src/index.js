const express = require('express')
const path = require('path');
var cors = require('cors');
const bodyParser = require('body-parser')
const app = express()
const server = require('http').createServer(app);
const port = 3000;
const db = require('./queries');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server:server })

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

wss.on('connection', function connection(ws) {
  console.log('A new client connected!');
  ws.send('Welcome new client!');
  ws.on('message', function incoming(message) {
    console.log(`received: %s`, message);
    ws.send('Got your message its: ' + message);
  });
});

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/boxes', async (req, res) => {
  let rows = await db.getBoxes();
  rows = rows.map(val => val.endpoint_path);
  res.status(200).render("boxes", { boxes: rows });
});
app.post('/boxes', db.createBox);
app.post('/:path', db.logRequest);
app.get('/:path', db.logRequest);
app.get('/inspect/:path', async (req, res) => {
  let rows = await db.getBox(req);
  console.log(rows);
  res.status(200).render("box", { requests: rows });
})

server.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
