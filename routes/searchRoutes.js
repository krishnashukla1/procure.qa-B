const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search - Global search across products, categories, subcategories, and suppliers
router.get('/search', searchController.globalSearch);

// GET /api/products/search - Search products by product name
router.get('/products/search', searchController.getProductsByProductName);

// GET /api/itemcode/search - Search products by item code
router.get('/itemcode/search', searchController.getProductsByItemCode);

// GET /api/category/search - Search products by category name
router.get('/category/search', searchController.getProductsByCategoryName);

// GET /api/subcategory/search - Search products by subcategory name
router.get('/subcategory/search', searchController.getProductsBySubCategoryName);

// GET /api/suppliers/search - Search products by supplier name
router.get('/supplier/search', searchController.getProductsBySupplierName);

module.exports = router;