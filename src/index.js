const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = 3000;

const { Server } = require('socket.io');
const io = new Server(server);

const db = require('./queries');

const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')))

const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (_, res) => {
  res.status(200).render("index");
})

app.get('/boxes', async (req, res) => {
  let rows = await db.getBoxes();
  rows = rows.map(val => val.endpoint_path);
  res.status(200).render("boxes", { boxes: rows });
});

app.post('/boxes', async (_, res) => {
  const endpoint = await db.createBox();
  res.status(201).render("boxCreated", { endpoint: endpoint });
});

const handleRequestCreation = async (req, res) => {
  let result = await db.logRequest(req, res);
  if (result == 'error') {
    res.status(404).json("That box does not exist, please try another box or create a new one");
  } else {
    const returnData = result.rows[0];
    io.emit('new request', returnData);
    res.status(201).json(`request logged with data: ${JSON.stringify(returnData)}`); 
  }
};

app.post('/:path', handleRequestCreation);
app.get('/:path', handleRequestCreation);

app.get('/inspect/:path', async (req, res) => {
  const rows = await db.getBox(req);
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
