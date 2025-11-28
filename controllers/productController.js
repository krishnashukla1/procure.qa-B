const mongoose = require('mongoose');  // Ensure this is at top

const Product = require('../models/product');
const Supplier = require('../models/supplier');
const Category = require('../models/category');
const SubCategory = require('../models/subCategory');

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');


const uploadBulkProducts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an Excel file.' });
  }

  const { supplierId } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const workbook = xlsx.readFile(filePath);
    const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const itemCodes = new Set();
    const duplicateItemCodes = [];
    const missingFieldsResponse = [];
    const successfulUploads = [];
    const uploadErrors = [];
    const requiredFields = ['Product Name', 'Item Code*', 'Unit*', 'Group', 'Brand', 'Description'];

    let successCount = 0;
    let rejectCount = 0;
    let duplicateItemCount = 0;
    let categoryCount = 0;
    let subCategoryCount = 0;
    let missingFieldCount = 0;

    for (const [index, row] of xlData.entries()) {
      const missingFields = [];

      const trimmedRow = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), (value || '').toString().trim()])
      );

      requiredFields.forEach(field => {
        if (!trimmedRow[field] || trimmedRow[field] === '') {
          missingFields.push(field);
          missingFieldCount++;
        }
      });

      if (missingFields.length > 0) {
        missingFieldsResponse.push({ row: index + 1, missingFields });
        uploadErrors.push({
          row: index + 1,
          error: `Missing fields: ${missingFields.join(', ')}`,
        });
        continue;
      }

      const { 'Item Code*': itemCode, 'Product Name': productName, 'Unit*': unit, 'Group': group, 'Brand': brand, 'Description': description } = trimmedRow;

      if (itemCode) {
        if (itemCodes.has(itemCode)) {
          duplicateItemCodes.push({ row: index + 1, itemCode });
          uploadErrors.push({
            row: index + 1,
            error: `Duplicate Item Code* found in Excel file: ${itemCode}`,
          });
          duplicateItemCount++;
          continue;
        } else {
          itemCodes.add(itemCode);
        }
      }

      const existingProduct = await Product.findOne({ ItemCode: itemCode });
      if (existingProduct) {
        uploadErrors.push({
          row: index + 1,
          error: `Duplicate Item Code* found in database: ${itemCode}`,
        });
        duplicateItemCount++;
        continue;
      }

      let category = await Category.findOne({ name: group });
      if (!category) {
        category = new Category({ name: group, imagePath: null });
        await category.save();
        console.log(`New Category added: ${group}`);
        categoryCount++;
      }
      const categoryId = category._id;

      let subCategory = await SubCategory.findOne({ name: brand, categoryId: categoryId });
      if (!subCategory) {
        subCategory = new SubCategory({ name: brand, categoryId: categoryId });
        try {
          await subCategory.save();
          console.log(`New SubCategory added: ${brand}`);
          subCategoryCount++;
        } catch (subCategoryError) {
          if (subCategoryError.code === 11000) {
            console.log(`SubCategory "${brand}" already exists. Skipping creation.`);
          } else {
            console.error(`Error creating SubCategory: ${subCategoryError.message}`);
            uploadErrors.push({
              row: index + 1,
              error: subCategoryError.message,
            });
          }
        }
      } else {
        console.log(`SubCategory "${brand}" already exists. Skipping creation.`);
      }

      try {
        const newProduct = new Product({
          ProductName: productName,
          ItemCode: itemCode,
          Category: {
            CategoryID: categoryId,
            CategoryName: group,
          },
          SubCategory: {
            SubCategoryID: subCategory._id,
            SubCategoryName: brand,
            CategoryID: categoryId,
          },
          Unit: unit,
          Description: description,
          supplierId: supplierId,
        });

        await newProduct.save();
        console.log(`Product added: ${productName}`);
        successfulUploads.push({ row: index + 1, productName });
        successCount++;
      } catch (productError) {
        console.error(`Error saving product on row ${index + 1}:`, productError.message);
        uploadErrors.push({
          row: index + 1,
          error: productError.message,
        });
      }
    }

    rejectCount = `Total Failed : ${duplicateItemCount + missingFieldCount}`;

    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: 'Bulk products upload completed.',
      successfulUploads,
      errors: uploadErrors,
      successCount,
      rejectCount,
      duplicateItemCount,
      categoryCount,
      subCategoryCount,
      missingFields: missingFieldsResponse,
    });
  } catch (err) {
    console.error('Error processing the Excel file:', err);
    res.status(500).json({ message: 'Error processing the Excel file.' });
  }
};

// CREATE PRODUCT

  const createProduct = async (req, res) => {
  try {
    const {
      ProductName,
      ItemCode,
      Unit,
      Description,
      Category,
      SubCategory,
      supplierId,
    } = req.body;

    if (!Category?.CategoryID || !SubCategory?.SubCategoryID) {
      return res.status(400).json({
        success: false,
        message: "Category & Subcategory are required",
      });
    }

    const product = await Product.create({
      ProductName,
      ItemCode,
      Unit,
      Description,
      Category,
      SubCategory,
      supplierId,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.log("❌ PRODUCT CREATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {

  try {
    const id = req.params.id;

    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      message: "Product updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {

  try {
    let { page = 1, limit = 10 } = req.query;
    page = Number(page);
    limit = Number(limit);

    const total = await Product.countDocuments();

    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      pagination: {
        totalElements: total,
        page,
        limit,
      },
      data: { products },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate('supplierId', 'companyName');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

const getProductsByQuery = async (req, res) => {
  const { q } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      $or: [
        { ProductName: regex },
        { ItemCode: regex },
      ],
    })
      .skip(skip)
      .limit(limit)
      .populate('supplierId', 'companyName')
      .select('ProductName ItemCode Category SubCategory Unit supplierId createdAt updatedAt');

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    const totalCount = await Product.countDocuments({
      $or: [
        { ProductName: regex },
        { ItemCode: regex },
      ],
    });
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts: totalCount,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).select('_id name');

    // FIXED: Return empty array instead of 404 (frontend handles it better)
    res.status(200).json({ categories });  // Always 200, even if empty
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

const getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({}).select('_id name categoryId');

    if (subCategories.length === 0) {
      return res.status(404).json({ message: 'No subcategories found' });
    }

    res.status(200).json({ subCategories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
};

const getSubcategoriesByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const subCategories = await SubCategory.find({ categoryId }).select('_id name');

    res.status(200).json({ subCategories });
  } catch (error) {
    console.error('Error fetching subcategories by category:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const categoryRegex = new RegExp(category, 'i');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      'Category.CategoryName': { $regex: categoryRegex },
    })
      .skip(skip)
      .limit(limit)
      .populate('supplierId', 'companyName')
      .select('ProductName ItemCode Category SubCategory Unit supplierId createdAt updatedAt');

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for the specified category' });
    }

    const totalCount = await Product.countDocuments({
      'Category.CategoryName': { $regex: categoryRegex },
    });
    const totalPages = Math.ceil(totalCount / limit);

    const result = products.map(product => ({
      id: product._id,
      ProductName: product.ProductName,
      ItemCode: product.ItemCode,
      Category: product.Category,
      SubCategory: product.SubCategory,
      Unit: product.Unit,
      supplierId: product.supplierId,
      createdAt: new Date(product.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date(product.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }));

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts: totalCount,
      products: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products by category', error: error.message });
  }
};

const getProductsBySubcategory = async (req, res) => {
  const { subcategory } = req.params;

  try {
    const subcategoryRegex = new RegExp(subcategory, 'i');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      'SubCategory.SubCategoryName': { $regex: subcategoryRegex },
    })
      .skip(skip)
      .limit(limit)
      .populate('supplierId', 'companyName')
      .select('ProductName ItemCode Category SubCategory Unit supplierId createdAt updatedAt');

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for the specified subcategory' });
    }

    const totalCount = await Product.countDocuments({
      'SubCategory.SubCategoryName': { $regex: subcategoryRegex },
    });
    const totalPages = Math.ceil(totalCount / limit);

    const result = products.map(product => ({
      id: product._id,
      ProductName: product.ProductName,
      ItemCode: product.ItemCode,
      Category: product.Category,
      SubCategory: product.SubCategory,
      Unit: product.Unit,
      supplierId: product.supplierId,
      createdAt: new Date(product.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date(product.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }));

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts: totalCount,
      products: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products by subcategory', error: error.message });
  }
};

module.exports = {
  uploadBulkProducts,
  createProduct,
  getProducts,
  getProductById,
  getProductsByQuery,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getAllSubCategories,
  getSubcategoriesByCategory,
  getProductsByCategory,
  getProductsBySubcategory,
};