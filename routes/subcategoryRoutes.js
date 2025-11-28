const express = require('express');
const { addSubcategory, getSubcategoriesByCategory, deleteSubcategory, getAllSubcategories, updateSubcategory } = require('../controllers/subcategoryController');

const router = express.Router();

// POST /api/admin/sub/categories/:categoryId/subcategories - Add a subcategory under a category
router.post('/categories/:categoryId/subcategories', addSubcategory);

// GET /api/admin/sub/categories/:categoryId/subcategories - Get all subcategories for a specific category
router.get('/categories/:categoryId/subcategories', getSubcategoriesByCategory);

// DELETE /api/admin/sub/subcategories/:subcategoryId - Delete a subcategory by ID
router.delete('/subcategories/:subcategoryId', deleteSubcategory);

// PUT /api/admin/sub/subcategories/:subcategoryId - Update a subcategory by ID
router.put('/subcategories/:subcategoryId', updateSubcategory);

// GET /api/admin/sub/subcategories - Get all subcategories
router.get('/subcategories', getAllSubcategories);

module.exports = router;