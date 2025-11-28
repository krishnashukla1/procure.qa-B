
const express = require('express');
const router = express.Router();
const { addClientHistory, getClientHistory } = require('../controllers/clientHistoryController');

// POST /api/admin/clientHistory/add - Add a new client history entry
router.post('/add', addClientHistory);

// GET /api/admin/clientHistory/:clientId - Get client history by client ID
router.get('/:clientId', getClientHistory);

module.exports = router;