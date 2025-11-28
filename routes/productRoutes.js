const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');

// Configure multer for file uploads (bulk Excel files)
const upload = multer({ dest: 'uploads/' });

// FIXED: Specific routes FIRST (before /:id) to avoid conflicts
// Bulk upload (POST, so no conflict)
router.post('/bulk-upload/:supplierId', upload.single('excelFile'), productController.uploadBulkProducts);

// Search and filters (these are specific, no param overlap)
router.get('/search/q', productController.getProductsByQuery);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/subcategory/:subcategory', productController.getProductsBySubcategory);

// Categories and Subcategories (MUST be before /:id)
router.get('/categories', productController.getAllCategories);
router.get('/subcategories', productController.getAllSubCategories);
router.get('/subcategories/by/:categoryId', productController.getSubcategoriesByCategory);

// Product CRUD (NOW LAST - /:id will only catch true IDs like /abc123)
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);  // Now safe
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// REMOVED: Old duplicates like /cat/categories, /sub/subcategories, /admin/cat/category, /admin/subcategories/:categoryId
// Use the clean ones above.

module.exports = router;