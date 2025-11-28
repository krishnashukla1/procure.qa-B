const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [2, 'Subcategory name must be at least 2 characters long'],
  },
  description: {
    type: String,
    trim: true,
  },
  categoryId: {  // FIXED: Single ObjectId (not array) for standard ref
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
}, { timestamps: true });

subCategorySchema.index({ name: 'text' });
subCategorySchema.index({ categoryId: 1 });  // NEW: For queries by category
subCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);