const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const paymentQueue = require('../queues/payment.queue');

exports.createPayment = async (req, res) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header required' });
    }

    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount and currency required' });
    }

    // ✅ Get merchant from auth middleware
    const merchantId = req.merchantId;

    // Check idempotency
    const existing = await pool.query(
      `SELECT response FROM idempotency_keys
      WHERE key = $1
      AND merchant_id = $2
      AND expires_at > NOW()`,
      [idempotencyKey, merchantId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0].response);
    }

    const paymentId = uuidv4();

    await pool.query(
      `INSERT INTO payments (id, merchant_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [paymentId, merchantId, amount, currency, 'pending']
    );

    const response = { paymentId, status: 'pending' };

    await pool.query(
      `INSERT INTO idempotency_keys (key, merchant_id, response, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [idempotencyKey, merchantId, response]
    );

    await paymentQueue.add({
      paymentId,
      amount,
      currency
    });

    return res.status(201).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, merchant_id, amount, currency, status, created_at, updated_at
       FROM payments
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};