const Product = require('../models/product');
const Supplier = require('../models/supplier');
const Category = require('../models/category');
const SubCategory = require('../models/subCategory');

const globalSearch = async (req, res) => {
  const searchQuery = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = {
      $or: [
        { ProductName: { $regex: searchQuery, $options: 'i' } },
        { 'Category.CategoryName': { $regex: searchQuery, $options: 'i' } },
        { 'SubCategory.SubCategoryName': { $regex: searchQuery, $options: 'i' } },
        { ItemCode: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .populate('supplierId', 'name contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.name || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};

const getProductsByProductName = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};
    const skip = (page - 1) * limit;

    const products = await Product.find({ ProductName: regex })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('supplierId', 'name contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments({ ProductName: regex });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.name || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching products by product name:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};

const getProductsByItemCode = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    const regex = q ? new RegExp(`^${q}`, 'i') : {};
    const skip = (page - 1) * limit;

    const products = await Product.find({ ItemCode: regex })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('supplierId', 'name contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments({ ItemCode: regex });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.name || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching products by item code:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};

const getProductsByCategoryName = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};
    const skip = (page - 1) * limit;

    const products = await Product.find({ 'Category.CategoryName': regex })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('supplierId', 'name contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments({ 'Category.CategoryName': regex });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.name || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching products by category name:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};

const getProductsBySubCategoryName = async (req, res) => {
  const { q, page = 1, limit = 500 } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : undefined;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const query = regex ? { 'SubCategory.SubCategoryName': regex } : {};

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('supplierId', 'name contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages,
        size: limit,
        pageNo: parseInt(page, 10),
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.name || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching products by subcategory name:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};

// const getProductsBySupplierName = async (req, res) => {
//   const { q, page = 1, limit = 10 } = req.query;

//   try {
//     const regex = q ? new RegExp(q, 'i') : {};
//     const skip = (page - 1) * limit;

//     const matchingSuppliers = await Supplier.find({ name: regex }).select('_id').lean();

//     if (!matchingSuppliers.length) {
//       return res.status(404).json({
//         code: 404,
//         error: true,
//         message: 'No suppliers found with the given name',
//         data: [],
//       });
//     }

//     const supplierIds = matchingSuppliers.map(supplier => supplier._id);

//     const products = await Product.find({ supplierId: { $in: supplierIds } })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate('supplierId', 'name contactNumber email')
//       .populate('Category', 'CategoryName')
//       .populate('SubCategory', 'SubCategoryName')
//       .lean();

//     const totalCount = await Product.countDocuments({ supplierId: { $in: supplierIds } });

//     const totalPages = Math.ceil(totalCount / limit);

//     res.status(200).json({
//       code: 200,
//       error: false,
//       pagination: {
//         totalElements: totalCount,
//         totalPages,
//         size: parseInt(limit, 10),
//         pageNo: parseInt(page, 10),
//         numberOfElements: products.length,
//       },
//       data: products.map(product => ({
//         productId: product._id,
//         supplierId: product.supplierId?._id || '',
//         productName: product.ProductName,
//         itemCode: product.ItemCode,
//         categoryName: product.Category?.CategoryName || '',
//         subCategoryName: product.SubCategory?.SubCategoryName || '',
//         supplierName: product.supplierId?.name || '',
//         supplierContactNumber: product.supplierId?.contactNumber || '',
//         supplierEmailId: product.supplierId?.email || '',
//       })),
//     });
//   } catch (error) {
//     console.error('Error fetching products by supplier name:', error);
//     res.status(500).json({
//       code: 500,
//       error: true,
//       message: 'Internal server error',
//     });
//   }
// };

const getProductsBySupplierName = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};
    const skip = (page - 1) * limit;

    // FIXED: Search supplier by real DB fields
    const matchingSuppliers = await Supplier.find({
      $or: [
        { companyName: regex },
        { firstName: regex },
        { lastName: regex }
      ]
    })
      .select('_id')
      .lean();

    if (!matchingSuppliers.length) {
      return res.status(404).json({
        code: 404,
        error: true,
        message: 'No suppliers found with the given name',
        data: [],
      });
    }

    const supplierIds = matchingSuppliers.map(supplier => supplier._id);

    const products = await Product.find({ supplierId: { $in: supplierIds } })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('supplierId', 'companyName contactNumber email')
      .populate('Category', 'CategoryName')
      .populate('SubCategory', 'SubCategoryName')
      .lean();

    const totalCount = await Product.countDocuments({ supplierId: { $in: supplierIds } });

    res.status(200).json({
      code: 200,
      error: false,
      pagination: {
        totalElements: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        size: parseInt(limit, 10),
        pageNo: parseInt(page, 10),
        numberOfElements: products.length,
      },
      data: products.map(product => ({
        productId: product._id,
        supplierId: product.supplierId?._id || '',
        productName: product.ProductName,
        itemCode: product.ItemCode,
        categoryName: product.Category?.CategoryName || '',
        subCategoryName: product.SubCategory?.SubCategoryName || '',
        supplierName: product.supplierId?.companyName || '',
        supplierContactNumber: product.supplierId?.contactNumber || '',
        supplierEmailId: product.supplierId?.email || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching products by supplier name:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Internal server error',
    });
  }
};


module.exports = {
  globalSearch,
  getProductsByProductName,
  getProductsByItemCode,
  getProductsByCategoryName,
  getProductsBySubCategoryName,
  getProductsBySupplierName,
};