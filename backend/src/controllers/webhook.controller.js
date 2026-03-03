const pool = require('../db');
const webhookQueue = require('../queues/webhook.queue');
const { v4: uuidv4 } = require('uuid');

exports.getWebhookLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, merchant_id, event, status, attempts
       FROM webhook_logs
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load webhook logs' });
  }
};

exports.retryWebhook = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `UPDATE webhook_logs
       SET status = 'pending'
       WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await webhookQueue.add({ webhookId: id });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Retry failed' });
  }
};

exports.sendTestWebhook = async (req, res) => {
  try {
    const merchantRes = await pool.query(
      'SELECT id FROM merchants LIMIT 1'
    );

    if (merchantRes.rows.length === 0) {
      return res.status(400).json({ error: 'No merchant configured' });
    }

    const merchantId = merchantRes.rows[0].id;
    const webhookId = uuidv4();

    await pool.query(
      `INSERT INTO webhook_logs
       (id, merchant_id, event, payload, status, attempts)
       VALUES ($1, $2, $3, $4, $5, 0)`,
      [
        webhookId,
        merchantId,
        'webhook.test',
        {},
        'pending'
      ]
    );

    await webhookQueue.add({ webhookId });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send test webhook' });
  }
};
exports.saveWebhookConfig = async (req, res) => {
  // merchant config is stored in DB, not memory
  res.json({ success: true });
};