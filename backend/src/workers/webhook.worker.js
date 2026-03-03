const axios = require('axios');
const crypto = require('crypto');
const pool = require('../db');
const webhookQueue = require('../queues/webhook.queue');
const { getNextRetryDelay } = require('../utils/webhookRetry');

webhookQueue.process(async (job) => {
  const { webhookId } = job.data;

  // Fetch webhook log
  const { rows } = await pool.query(
    'SELECT * FROM webhook_logs WHERE id = $1',
    [webhookId]
  );

  if (rows.length === 0) return;

  const log = rows[0];

  // Fetch merchant (multi-tenant fix)
  const merchantRes = await pool.query(
    'SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1',
    [log.merchant_id]
  );

  if (merchantRes.rows.length === 0) {
    console.error('Merchant not found for webhook');
    return;
  }

  const { webhook_url, webhook_secret } = merchantRes.rows[0];

  const payload = log.payload;
  const body = JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', webhook_secret)
    .update(body)
    .digest('hex');

  try {
    const res = await axios.post(webhook_url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      },
      timeout: 5000
    });

    await pool.query(
      `UPDATE webhook_logs
       SET status = 'success',
           attempts = attempts + 1,
           last_attempt_at = NOW(),
           response_code = $1,
           response_body = $2
       WHERE id = $3`,
      [res.status, JSON.stringify(res.data), webhookId]
    );

  } catch (err) {
    const attempts = log.attempts + 1;
    const delay = getNextRetryDelay(attempts);

    if (delay === null) {
      await pool.query(
        `UPDATE webhook_logs
         SET status = 'failed',
             attempts = $1,
             last_attempt_at = NOW()
         WHERE id = $2`,
        [attempts, webhookId]
      );
      return;
    }

    await pool.query(
      `UPDATE webhook_logs
      SET attempts = $1,
          last_attempt_at = NOW(),
          next_retry_at = NOW() + ($2 * INTERVAL '1 second')
      WHERE id = $3`,
      [attempts, delay, webhookId]
    );

    await webhookQueue.add(
      { webhookId },
      { delay: delay * 1000 }
    );
  }
});