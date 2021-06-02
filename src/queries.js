const Pool = require('pg').Pool
const pool = new Pool({
  user: 'lee',
  host: 'localhost',
  database: 'callbox',
  password: 'password',
  port: 5432,
})

const generateId = () => {
  return Math.random().toString(16).slice(2)
}

const getBoxes = (req, res) => {
  pool.query('SELECT * FROM endpoints ORDER BY endpoint_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
}

const getBox = (req, res) => {
  console.log("Get Box");
  const path = req.params.path;

  pool.query('SELECT * FROM requests r WHERE r.endpoint_id = (SELECT e.endpoint_id FROM endpoints e WHERE e.endpoint_path = $1)', [path], (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
}

const createBox = (req, res) => {
  const path = generateId();

  pool.query('INSERT INTO endpoints (endpoint_path) VALUES ($1) RETURNING endpoint_path', [path], (error, results) => {
    if (error) {
      throw error
    }
    res.status(201).json(`New box created with url: ${'holdenchoi.com/' + results.rows[0].endpoint_path}`);
  })
}

const logRequest = async (req, res) => {
  const endpoint_path = req.params.path
  const { rows } = await pool.query('SELECT endpoint_id FROM endpoints WHERE endpoint_path = $1', [endpoint_path]); 

  if (rows.length == 0) {
    res.status(404).json("That box does not exist, please try another box or create a new one");
    return;
  }

  const endpointId = parseInt(rows[0].endpoint_id, 10);
  const reqInfo = {
    Method: req.method,
    Protocol: req.protocol,
    Host: req.headers.host,
    "User-Agent": req.headers['user-agent'],
    Accept: req.headers.accept,
    "X-Forwarded-For": req.headers['x-forwarded-for'],
    "X-Forwarded-Proto": req.headers['x-forwarded-proto'],
    "Accepted-Encoding": req.headers['accept-encoding'],
  }
  const data = JSON.stringify(reqInfo);

  pool.query('INSERT INTO requests (endpoint_id, data) VALUES ($1, $2) RETURNING data', [endpointId, data], (error, result) => {
    if (error) {
      throw error
    }

    const returnData = result.rows[0].data;

    res.status(201).json(`request logged with data: ${JSON.stringify(returnData)}`); 
  })
}

module.exports = {
  getBox,
  getBoxes,
  createBox,
  logRequest,
}
