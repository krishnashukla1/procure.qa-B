const Banner = require('../models/banner');
const Category = require('../models/category');
const Supplier = require('../models/supplier');
const fs = require('fs');
const path = require('path');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'; // Fallback for dev

// Helper: Delete file safely
const deleteFile = (fullPath) => {
  const localPath = fullPath.replace(`${BASE_URL}/images/bannerImage/`, '');
  const filePath = path.join('images/bannerImage', localPath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// GET /api/admin/banner - List all banners (paginated)
const getBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, q } = req.query; // Optional search
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (q) {
      query = { $or: [
        { description: { $regex: q, $options: 'i' } },
        { bannerImage: { $regex: q, $options: 'i' } }
      ] };
    }

    const [banners, total] = await Promise.all([
      Banner.find(query)
        .populate('categoryId', 'name categoryImagePath')
        .populate('supplierId', 'name companyLogo')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Banner.countDocuments(query),
    ]);

    // Format image URLs
    const formattedBanners = banners.map((banner) => ({
      ...banner.toObject(),
      bannerImage: banner.bannerImage.startsWith('http') 
        ? banner.bannerImage 
        : `${BASE_URL}/images/bannerImage/${path.basename(banner.bannerImage)}`,
    }));

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: total,
        totalPages: Math.ceil(total / parseInt(limit)),
        size: parseInt(limit),
        pageNo: parseInt(page),
        numberOfElements: formattedBanners.length,
      },
      data: formattedBanners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ code: 500, error: true, message: 'Internal server error' });
  }
};

// GET /api/admin/banner/:id - Single banner
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id)
      .populate('categoryId', 'name categoryImagePath')
      .populate('supplierId', 'name companyLogo');

    if (!banner) {
      return res.status(404).json({ code: 404, error: true, message: 'Banner not found' });
    }

    const formattedBanner = {
      ...banner.toObject(),
      bannerImage: banner.bannerImage.startsWith('http') 
        ? banner.bannerImage 
        : `${BASE_URL}/images/bannerImage/${path.basename(banner.bannerImage)}`,
    };

    res.status(200).json({
      code: 200,
      error: false,
      data: formattedBanner,
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ code: 500, error: true, message: 'Internal server error' });
  }
};

// POST /api/home/banner - Create banner
const createBanner = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !req.file) {
      return res.status(400).json({ code: 400, error: true, message: 'Description and image are required' });
    }

    const bannerImagePath = `${BASE_URL}/images/bannerImage/${req.file.filename}`;

    const newBanner = new Banner({
      description,
      bannerImage: bannerImagePath,
    });

    const savedBanner = await newBanner.save();

    res.status(201).json({
      code: 201,
      error: false,
      message: 'Banner created successfully',
      data: savedBanner,
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    if (req.file) {
      deleteFile(`${BASE_URL}/images/bannerImage/${req.file.filename}`); // Cleanup on error
    }
    res.status(500).json({ code: 500, error: true, message: 'Error creating banner' });
  }
};

// PUT /api/admin/banner/:id - Update banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ code: 404, error: true, message: 'Banner not found' });
    }

    // Update fields
    if (description) banner.description = description;

    // Handle new image
    if (req.file) {
      deleteFile(banner.bannerImage); // Delete old
      banner.bannerImage = `${BASE_URL}/images/bannerImage/${req.file.filename}`;
    }

    const updatedBanner = await banner.save();

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Banner updated successfully',
      data: updatedBanner,
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    if (req.file) {
      deleteFile(`${BASE_URL}/images/bannerImage/${req.file.filename}`); // Cleanup
    }
    res.status(500).json({ code: 500, error: true, message: 'Error updating banner' });
  }
};

// DELETE /api/admin/banner/:id - Delete banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ code: 404, error: true, message: 'Banner not found' });
    }

    deleteFile(banner.bannerImage); // Delete file
    await Banner.findByIdAndDelete(id);

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ code: 500, error: true, message: 'Error deleting banner' });
  }
};

// GET /api/home/ - Combined data (homepage)
// const getAllData = async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   const skip = (parseInt(page) - 1) * parseInt(limit);

//   try {
//     const [banners, totalBanners, categories, suppliers] = await Promise.all([
//       Banner.find().skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
//       Banner.countDocuments(),
//       Category.find().lean(),
//       Supplier.find().lean(),
//     ]);

//     // Format banners
//     const bannerList = banners.map((banner) => ({
//       id: banner._id,
//       description: banner.description,
//       bannerImage: banner.bannerImage.startsWith('http')
//         ? banner.bannerImage
//         : `${BASE_URL}/images/bannerImage/${path.basename(banner.bannerImage)}`,
//     }));

//     // Format categories & suppliers (as before)
//     const categoryList = categories.map((category) => ({
//       id: category._id,
//       name: category.name,
//       categoryImagePath: category.categoryImagePath
//         ? (category.categoryImagePath.startsWith('http')
//           ? category.categoryImagePath
//           : `${BASE_URL}/images/categoryImage/${category.categoryImagePath}`)
//         : null,
//     }));

//     const supplierList = suppliers.map((supplier) => ({
//       id: supplier._id,
//       name: supplier.name || supplier.companyName,
//       companyLogo: supplier.companyLogo
//         ? (supplier.companyLogo.startsWith('http')
//           ? supplier.companyLogo
//           : `${BASE_URL}/images/cmpLogo/${supplier.companyLogo}`)
//         : null,
//     }));

//     res.status(200).json({
//       code: 200,
//       error: false,
//       pagination: {
//         totalElements: totalBanners,
//         totalPages: Math.ceil(totalBanners / parseInt(limit)),
//         size: parseInt(limit),
//         pageNo: parseInt(page),
//         numberOfElements: bannerList.length,
//       },
//       data: {
//         banners: bannerList,
//         categories: categoryList,
//         suppliers: supplierList,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching all data:', error);
//     res.status(500).json({ code: 500, error: true, message: 'Internal server error' });
//   }
// };


// GET /api/home/ - Combined data (homepage)
const getAllData = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [banners, totalBanners, categories, suppliers] = await Promise.all([
      Banner.find().skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
      Banner.countDocuments(),
      Category.find().lean(),
      Supplier.find().lean(),
    ]);

    // Format banners (unchanged)
    const bannerList = banners.map((banner) => ({
      id: banner._id,
      description: banner.description,
      bannerImage: banner.bannerImage.startsWith('http')
        ? banner.bannerImage
        : `${BASE_URL}/images/bannerImage/${path.basename(banner.bannerImage)}`,
    }));

    // Format categories - FIXED: Handle 'undefined' paths
    const categoryList = categories.map((category) => ({
      id: category._id,
      name: category.name,
      categoryImagePath: category.categoryImagePath && category.categoryImagePath !== 'undefined'
        ? (category.categoryImagePath.startsWith('http')
          ? category.categoryImagePath
          : `${BASE_URL}/images/categoryImage/${category.categoryImagePath}`)
        : null,  // <-- THIS IS THE SNIPPET PLACED HERE
    }));

    // Format suppliers - Similar fix (optional, if suppliers have issues)
    const supplierList = suppliers.map((supplier) => ({
      id: supplier._id,
      name: supplier.name || supplier.companyName,
      companyLogo: supplier.companyLogo && supplier.companyLogo !== 'undefined'
        ? (supplier.companyLogo.startsWith('http')
          ? supplier.companyLogo
          : `${BASE_URL}/images/cmpLogo/${supplier.companyLogo}`)
        : null,
    }));

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalBanners,
        totalPages: Math.ceil(totalBanners / parseInt(limit)),
        size: parseInt(limit),
        pageNo: parseInt(page),
        numberOfElements: bannerList.length,
      },
      data: {
        banners: bannerList,
        categories: categoryList,
        suppliers: supplierList,
      },
    });
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ code: 500, error: true, message: 'Internal server error' });
  }
};


module.exports = {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllData,
};