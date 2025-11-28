const express = require('express');
const { 
  addCategory, 
  getCategories, 
  getCategoryById, 
  updateCategory, 
  updateCategoryWithImage,
  deleteCategory, 
  createCategory, 
  getAllCategories, 
  getQueryCategories 
} = require('../controllers/categoryController');

const router = express.Router();

// POST /api/admin/cat/categories - Add a new category (without image)
router.post('/categories', addCategory);

// POST /api/admin/cat/category - Create a new category (with image)
router.post('/category', createCategory);

// GET /api/admin/cat/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/admin/cat/categories/:id - Get a category by ID
router.get('/categories/:id', getCategoryById);

// PUT /api/admin/cat/categories/:id - Update a category by ID (without image)
router.put('/categories/:id', updateCategory);

// PUT /api/admin/cat/categories/:id/image - Update a category with image
router.put('/categories/:id/image', updateCategoryWithImage);

// DELETE /api/admin/cat/categories/:id - Delete a category by ID
router.delete('/categories/:id', deleteCategory);

// GET /api/admin/cat/category - Get all categories with pagination and search
router.get('/category', getAllCategories);

// GET /api/admin/cat/search - Search categories by query
router.get('/search', getQueryCategories);

module.exports = router;