const refundQueue = require('../queues/refund.queue');
const webhookQueue = require('../queues/webhook.queue');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

refundQueue.process(async (job) => {
  const { refundId } = job.data;

  const isTestMode = process.env.TEST_MODE === 'true';

  const delay = isTestMode ? 1000 : 3000;
  await new Promise((r) => setTimeout(r, delay));

  const { rows } = await pool.query(
    'SELECT payment_id, amount FROM refunds WHERE id = $1',
    [refundId]
  );

  if (rows.length === 0) return;

  const refund = rows[0];

  await pool.query(
    `UPDATE refunds 
     SET status = 'processed',
         processed_at = NOW()
     WHERE id = $1`,
    [refundId]
  );

  const payload = {
    refundId,
    paymentId: refund.payment_id,
    amount: refund.amount,
    status: 'processed'
  };

  const webhookId = uuidv4();

  await pool.query(
    `INSERT INTO webhook_logs (id, event, payload, status)
     VALUES ($1, 'refund.processed', $2, 'pending')`,
    [webhookId, payload]
  );

  await webhookQueue.add({ webhookId });
});