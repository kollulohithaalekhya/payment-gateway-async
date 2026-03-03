const express = require('express');
const router = express.Router();

const { createPayment } = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { getPayment } = require('../controllers/payment.controller');


router.post('/payments', authMiddleware, createPayment);
router.get('/payments/:id', authMiddleware, getPayment);
module.exports = router;
