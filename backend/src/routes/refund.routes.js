const express = require('express');
const router = express.Router();

const {
  createRefund,
  getRefundById
} = require('../controllers/refund.controller');

router.post('/refunds', createRefund);
router.get('/refunds/:id', getRefundById);

module.exports = router;