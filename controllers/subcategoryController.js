const Category = require('../models/category');
const SubCategory = require('../models/subCategory');

const addSubcategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name, description } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const existingSubcategory = await SubCategory.findOne({
      name: name.trim(),
      categoryId: categoryId,
    });
    if (existingSubcategory) {
      return res.status(400).json({ message: 'Subcategory already exists for this category' });
    }

    const newSubcategory = new SubCategory({
      name: name.trim(),
      description: description ? description.trim() : '',
      categoryId: [categoryId],
    });

    await newSubcategory.save();

    res.status(201).json({
      message: 'Subcategory created successfully',
      subcategory: newSubcategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubcategoriesByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subcategories = await SubCategory.find({ categoryId: categoryId });

    if (subcategories.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(subcategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubcategory = async (req, res) => {
  const { subcategoryId } = req.params;

  try {
    const subcategory = await SubCategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    await SubCategory.findByIdAndDelete(subcategoryId);

    res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSubcategory = async (req, res) => {
  const { subcategoryId } = req.params;
  const { name, description } = req.body;

  try {
    const subcategory = await SubCategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    subcategory.name = name ? name.trim() : subcategory.name;
    subcategory.description = description ? description.trim() : subcategory.description;

    await subcategory.save();

    res.status(200).json({
      message: 'Subcategory updated successfully',
      subcategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllSubcategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const subcategories = await SubCategory.find()
      .skip(skip)
      .limit(limit);

    const totalSubcategories = await SubCategory.countDocuments();
    const totalPages = Math.ceil(totalSubcategories / limit);

    if (subcategories.length === 0) {
      return res.status(200).json({
        code: 200,
        error: false,
        message: 'No subcategories found',
        pagination: {
          totalElements: totalSubcategories,
          totalPages,
          size: limit,
          pageNo: page,
          numberOfElements: subcategories.length,
        },
        data: [],
      });
    }

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Subcategories fetched successfully',
      pagination: {
        totalElements: totalSubcategories,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: subcategories.length,
      },
      data: {
        subcategories,
      },
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Failed to retrieve subcategories',
      pagination: null,
      data: null,
    });
  }
};

module.exports = {
  addSubcategory,
  getSubcategoriesByCategory,
  deleteSubcategory,
  updateSubcategory,
  getAllSubcategories,
};