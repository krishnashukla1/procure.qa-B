const express = require('express');
const router = express.Router();
const { getBanners, getBannerById, createBanner, updateBanner, deleteBanner, getAllData } = require('../controllers/bannerController');
const upload = require('../middleware/upload'); // Correct path

// GET /api/home/ - Combined data (banners + categories + suppliers) for homepage
router.get('/', getAllData);

// GET /api/admin/banner - Get all banners (paginated, for admin)
router.get('/admin/banner', getBanners);

// GET /api/admin/banner/:id - Get single banner by ID
router.get('/admin/banner/:id', getBannerById);

// POST /api/home/banner - Create new banner (with file upload)
router.post('/banner', upload.single('bannerImage'), createBanner);

// PUT /api/admin/banner/:id - Update banner (optional new image)
router.put('/admin/banner/:id', upload.single('bannerImage'), updateBanner);

// DELETE /api/admin/banner/:id - Delete banner (removes file too)
router.delete('/admin/banner/:id', deleteBanner);

module.exports = router;