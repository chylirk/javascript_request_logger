const express = require('express')
const path = require('path');
var cors = require('cors');
const bodyParser = require('body-parser')
const app = express()
const port = 3000;

const db = require('./queries');

app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/boxes', db.getBoxes);
app.post('/boxes', db.createBox);
app.post('/:path', db.logRequest);
app.get('/:path', db.logRequest);
app.get('/inspect/:path', db.getBox);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
