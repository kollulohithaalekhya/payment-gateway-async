const express = require('express');
const router = express.Router();

const paymentQueue = require('../queues/payment.queue');
const refundQueue = require('../queues/refund.queue');
const webhookQueue = require('../queues/webhook.queue');

router.get('/test/jobs/status', async (req, res) => {
  try {
    const paymentCounts = await paymentQueue.getJobCounts();
    const refundCounts = await refundQueue.getJobCounts();
    const webhookCounts = await webhookQueue.getJobCounts();

    res.json({
      paymentQueue: paymentCounts,
      refundQueue: refundCounts,
      webhookQueue: webhookCounts,
      worker_status: 'running'
    });
  } catch (err) {
    console.error('Job status error:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

module.exports = router;