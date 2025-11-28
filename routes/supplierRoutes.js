const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// GET /api/admin/suppliers - Get all suppliers
router.get('/', supplierController.getAllSuppliers);

// GET /api/admin/suppliers/:id - Get a supplier by ID
router.get('/:id', supplierController.getSupplierById);

// POST /api/admin/suppliers - Create a new supplier
router.post('/', supplierController.createSupplier);

// PUT /api/admin/suppliers/:id - Update a supplier by ID
router.put('/:id', supplierController.updateSupplier);

// DELETE /api/admin/suppliers/:id - Delete a supplier by ID
router.delete('/:id', supplierController.deleteSupplier);

// GET /api/admin/suppliers/search/name - Search suppliers by name
router.get('/search/name', supplierController.getSuppliersByName);

// POST /api/admin/suppliers/suppliers - Insert a supplier (alternative endpoint)
router.post('/suppliers', supplierController.insertSupplier);

// GET /api/admin/suppliers/name/logo - Get suppliers with company name, type, and logo (paginated)
router.get('/name/logo', supplierController.getSuppliers);

// GET /api/admin/suppliers/search/q - Search suppliers by query
router.get('/search/q', supplierController.getSuppliersbyQuery);

module.exports = router;