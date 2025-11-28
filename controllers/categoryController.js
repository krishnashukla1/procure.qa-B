const Category = require('../models/category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL;
const SubCategory = require('../models/subCategory');

// Helper to ensure directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Configure Multer for category images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'images/categoryImage/';
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (JPEG, JPG, PNG)'));
  }
};

const uploadCategory = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// const addCategory = async (req, res) => {
//   const { name, description } = req.body;

//   if (!name || name.trim() === '') {
//     return res.status(400).json({ error: 'Category name is required' });
//   }

//   try {
//     const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });

//     if (existingCategory) {
//       return res.status(400).json({ error: 'Category already exists' });
//     }

//     const newCategory = new Category({
//       name: name.trim(),
//       description: description ? description.trim() : '',
//     });

//     await newCategory.save();

//     res.status(201).json({
//       message: 'Category added successfully',
//       category: newCategory,
//     });
//   } catch (error) {
//     console.error('Error adding category:', error);
//     res.status(500).json({ error: 'Failed to add category' });
//   }
// };



// const addCategory = async (req, res) => {
//   const { name, description, subcategories } = req.body;  // Added: subcategories as array of strings (e.g., ["LG", "Samsung"])

//   if (!name || name.trim() === '') {
//     return res.status(400).json({ error: 'Category name is required' });
//   }

//   try {
//     // Parse subcategories if provided (expect JSON string or array)
//     let subcatNames = [];
//     if (subcategories) {
//       try {
//         subcatNames = typeof subcategories === 'string' ? JSON.parse(subcategories) : subcategories;
//         if (!Array.isArray(subcatNames)) {
//           subcatNames = [subcatNames];
//         }
//         subcatNames = subcatNames.map(n => n.trim()).filter(n => n.length > 0);
//       } catch (parseErr) {
//         return res.status(400).json({ error: 'Invalid subcategories format. Use JSON array like ["LG", "Samsung"]' });
//       }
//     }

//     // Check if category with same name already exists
//     const existingCategory = await Category.findOne({ 
//       name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
//     });

//     if (existingCategory) {
//       return res.status(400).json({ error: 'Category already exists' });
//     }

//     // Create subcategories first if provided
//     let subcatIds = [];
//     if (subcatNames.length > 0) {
//       for (const subName of subcatNames) {
//         // Check if subcategory already exists (global unique by name, case-insensitive)
//         let subCat = await SubCategory.findOne({ name: { $regex: new RegExp(`^${subName}$`, 'i') } });
//         if (!subCat) {
//           subCat = new SubCategory({ name: subName });
//           await subCat.save();
//         }
//         subcatIds.push(subCat._id);
//       }
//     }

//     const newCategory = new Category({
//       name: name.trim(),
//       description: description ? description.trim() : '',
//       subCategoryId: subcatIds,  // Link the subcat IDs
//     });

//     await newCategory.save();

//     // Optionally populate subcats in response
//     const populatedCategory = await Category.findById(newCategory._id).populate('subCategoryId', 'name');

//     res.status(201).json({
//       message: 'Category added successfully with subcategories',
//       category: populatedCategory,
//     });
//   } catch (error) {
//     console.error('Error adding category:', error);
//     res.status(500).json({ error: 'Failed to add category' });
//   }
// };




const addCategory = async (req, res) => {
  const { name, description, subcategories } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    // Parse subcategories
    let subcatNames = [];
    if (subcategories) {
      try {
        subcatNames =
          typeof subcategories === "string"
            ? JSON.parse(subcategories)
            : subcategories;

        if (!Array.isArray(subcatNames)) {
          subcatNames = [subcatNames];
        }

        subcatNames = subcatNames
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
      } catch (err) {
        return res.status(400).json({
          error:
            'Invalid subcategories format. Use ["LG","KG","MG"] format.',
        });
      }
    }

    // Check duplicate
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // STEP 1: Create category first
    const newCategory = new Category({
      name: name.trim(),
      description: description?.trim() || "",
    });

    await newCategory.save();

    // STEP 2: Create subcategories WITH categoryId
    let subcatIds = [];

    if (subcatNames.length > 0) {
      for (const subName of subcatNames) {
        let subCat = await SubCategory.findOne({
          name: { $regex: new RegExp(`^${subName}$`, "i") },
        });

        if (!subCat) {
          subCat = new SubCategory({
            name: subName,
            categoryId: newCategory._id, // FIXED 🔥 REQUIRED
          });

          await subCat.save();
        }

        subcatIds.push(subCat._id);
      }
    }

    // STEP 3: Save subcategory references inside category
    newCategory.subCategoryId = subcatIds;
    await newCategory.save();

    // STEP 4: Populate & return
    const populatedCategory = await Category.findById(newCategory._id).populate(
      "subCategoryId",
      "name"
    );

    res.status(201).json({
      message: "Category created successfully",
      category: populatedCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
};


const createCategory = async (req, res) => {
  try {
    uploadCategory.single('categoryImage')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      // Check if category with same name already exists
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
      });

      if (existingCategory) {
        // Delete uploaded file if category already exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Category with this name already exists' });
      }

      const categoryImagePath = req.file ? `${BASE_URL}/images/categoryImage/${req.file.filename}` : null;

      const category = new Category({
        name: name.trim(),
        categoryImagePath,
        description: description ? description.trim() : '',
      });

      const savedCategory = await category.save();

      res.status(201).json({
        message: 'Category created successfully',
        category: savedCategory,
      });
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const categories = await Category.find(searchQuery)
      .select('name categoryImagePath description createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Categories fetched successfully',
      pagination: {
        totalElements: totalCategories,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: categories.length,
      },
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error fetching categories',
      pagination: null,
      data: null,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

const getQueryCategories = async (req, res) => {
  const { q } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};

    const categories = await Category.find({ 
      $or: [
        { name: regex },
        { description: regex }
      ]
    }).select('name categoryImagePath description').sort({ name: 1 });

    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    category.name = name.trim();
    category.description = description ? description.trim() : '';

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// New function to update category with image
const updateCategoryWithImage = async (req, res) => {
  try {
    uploadCategory.single('categoryImage')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }

      try {
        const category = await Category.findById(id);
        if (!category) {
          // Delete uploaded file if category not found
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(404).json({ error: 'Category not found' });
        }

        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
          _id: { $ne: id },
        });

        if (existingCategory) {
          // Delete uploaded file if category already exists
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ error: 'Category with this name already exists' });
        }

        // Delete old image if exists and new image is uploaded
        if (req.file && category.categoryImagePath) {
          const oldImagePath = category.categoryImagePath.replace(`${BASE_URL}/`, '');
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        category.name = name.trim();
        category.description = description ? description.trim() : '';
        
        // Update image path if new image is uploaded
        if (req.file) {
          category.categoryImagePath = `${BASE_URL}/images/categoryImage/${req.file.filename}`;
        }

        await category.save();

        res.status(200).json({
          message: 'Category updated successfully',
          category,
        });
      } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
      }
    });
  } catch (error) {
    console.error('Error in updateCategoryWithImage:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete associated image file if exists
    if (category.categoryImagePath) {
      const imagePath = category.categoryImagePath.replace(`${BASE_URL}/`, '');
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryWithImage,
  deleteCategory,
  createCategory,
  getAllCategories,
  getQueryCategories,
};