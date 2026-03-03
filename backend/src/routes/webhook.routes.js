const express = require('express');
const router = express.Router();

const {
  getWebhookLogs,
  retryWebhook,
  saveWebhookConfig,
  sendTestWebhook
} = require('../controllers/webhook.controller');

const authMiddleware = require('../middleware/auth.middleware');

// Protect all webhook routes
router.get('/webhooks/logs', authMiddleware, getWebhookLogs);
router.post('/webhooks/:id/retry', authMiddleware, retryWebhook);
router.post('/webhooks/config', authMiddleware, saveWebhookConfig);
router.post('/webhooks/test', authMiddleware, sendTestWebhook);

module.exports = router;