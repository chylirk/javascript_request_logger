const Pool = require('pg').Pool
const pool = new Pool({
  user: 'holden',
  host: 'localhost',
  database: 'callbox',
  password: 'password',
  port: 5432,
})

const generateId = () => {
  return Math.random().toString(16).slice(2)
}

const getBoxes = async () => {
  const results = await pool.query('SELECT * FROM endpoints ORDER BY endpoint_id ASC');
  return results.rows;
}

const getBox = async (req, _) => {
  const path = req.params.path;
  const results = await pool.query('SELECT * FROM requests r WHERE r.endpoint_id = (SELECT e.endpoint_id FROM endpoints e WHERE e.endpoint_path = $1) ORDER BY created_at DESC', [path]);
  return results.rows;
}

const createBox = async (req, res) => {
  const path = generateId();
  const results = await pool.query('INSERT INTO endpoints (endpoint_path) VALUES ($1) RETURNING endpoint_path', [path]);
  return results.rows[0].endpoint_path;
  // pool.query('INSERT INTO endpoints (endpoint_path) VALUES ($1) RETURNING endpoint_path', [path], (error, results) => {
  //   if (error) {
  //     throw error
  //   }
  //   const endpoint = results.rows[0].endpoint_path;
  //   res.status(201).json(`New box created! Send requests to: holdenchoi.com/${endpoint}. Inspect your requests at: holdenchoi.com/inspect/${endpoint}`);
  // })
}

const logRequest = async (req, res) => {
  const endpoint_path = req.params.path
  const { rows } = await pool.query('SELECT endpoint_id FROM endpoints WHERE endpoint_path = $1', [endpoint_path]); 

  if (rows.length == 0) {
    return 'error';
  }

  const endpointId = parseInt(rows[0].endpoint_id, 10);
  let data = req.headers;
  data.method = req.method;
  data.body = req.body;
  data = JSON.stringify(data);

  const results = await pool.query('INSERT INTO requests (endpoint_id, data) VALUES ($1, $2) RETURNING *', [endpointId, data]);
  return results;
}

module.exports = {
  getBox,
  getBoxes,
  createBox,
  logRequest,
}
