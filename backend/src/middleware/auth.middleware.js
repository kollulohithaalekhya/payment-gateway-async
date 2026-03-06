const pool = require('../db');

module.exports = async function (req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { rows } = await pool.query(
      'SELECT id FROM merchants WHERE api_key = $1',
      [apiKey]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.merchantId = rows[0].id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Auth failed' });
  }
};