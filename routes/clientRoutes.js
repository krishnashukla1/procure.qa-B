const express = require('express');
const { 
  getAllClients, 
  createClient, 
  getClientById, 
  updateClient, 
  deleteClient 
} = require('../controllers/clientController');

const router = express.Router();

// GET /api/admin/clients - Get all clients
router.get('/', getAllClients);

// GET /api/admin/clients/:id - Get client by ID
router.get('/:id', getClientById);

// POST /api/admin/clients - Create a new client
router.post('/', createClient);

// PUT /api/admin/clients/:id - Update a client
router.put('/:id', updateClient);

// DELETE /api/admin/clients/:id - Delete a client
router.delete('/:id', deleteClient);

module.exports = router;