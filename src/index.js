const express = require('express')
const path = require('path');
var cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3000;
const db = require('./queries');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/boxes', async (req, res) => {
  let rows = await db.getBoxes();
  rows = rows.map(val => val.endpoint_path);
  res.status(200).render("boxes", { boxes: rows });
});

app.post('/boxes', db.createBox);

app.post('/:path', async (req, res) => {
  let result = await db.logRequest(req, res);
  if (result == 'error') {
    res.status(404).json("That box does not exist, please try another box or create a new one");
  } else {
    // const returnData = result.rows[0].data;
    const returnData = result.rows[0];
    io.emit('new request', returnData);
    res.status(201).json(`request logged with data: ${JSON.stringify(returnData)}`); 
  }
});

app.get('/:path', async (req, res) => {
  let result = await db.logRequest(req, res);
  if (result == 'error') {
    res.status(404).json("That box does not exist, please try another box or create a new one");
  } else {
    // const returnData = result.rows[0].data;
    const returnData = result.rows[0];
    io.emit('new request', returnData);
    res.status(201).json(`request logged with data: ${JSON.stringify(returnData)}`); 
  }
});


app.get('/inspect/:path', async (req, res) => {
  let rows = await db.getBox(req);
  res.status(200).render("box", { requests: rows });
})

io.on('connection', (socket) => {
  console.log('user is watching a box');

  socket.on('new request', (data) => {
    console.log(`new request: + ${data}`);
  });

  socket.on('disconnect', () => {
    console.log('user no longer watching box');
  });
})

server.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
