const paymentQueue = require('../queues/payment.queue');
const webhookQueue = require('../queues/webhook.queue');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

paymentQueue.process(async (job) => {
  const { paymentId, amount, currency } = job.data;

  const isTestMode = process.env.TEST_MODE === 'true';

  const delay = isTestMode
    ? 1000
    : Math.floor(Math.random() * 5000) + 5000;

  await new Promise((r) => setTimeout(r, delay));

  const successRate = isTestMode ? 1 : 0.8;
  const isSuccess = Math.random() < successRate;

  const status = isSuccess ? 'success' : 'failed';

  // 🔹 Update payment status
  await pool.query(
    'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, paymentId]
  );

  const event = isSuccess ? 'payment.success' : 'payment.failed';

  const payload = {
    paymentId,
    amount,
    currency,
    status
  };

  const webhookId = uuidv4();

  // 🔹 Fetch merchant_id from payment
  const paymentRes = await pool.query(
    'SELECT merchant_id FROM payments WHERE id = $1',
    [paymentId]
  );

  const merchantId = paymentRes.rows[0].merchant_id;

  // 🔹 Insert webhook with merchant isolation
    await pool.query(
    `INSERT INTO webhook_logs
    (id, merchant_id, event, payload, status, attempts)
    VALUES ($1, $2, $3, $4, $5, 0)`,
    [webhookId, merchantId, event, payload, 'pending']
  );

  await webhookQueue.add({ webhookId });
});