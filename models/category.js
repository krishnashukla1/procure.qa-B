const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Category name must be at least 3 characters long'],
  },
  description: {
    type: String,
    trim: true,
  },
  categoryImagePath: {
    type: String,
    default: null,
  },
  // subCategoryId: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'SubCategory',
  // }],
  // supplierId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Supplier',
  // },

  subCategories: [{  // FIXED: Renamed from subCategoryId to subCategories for clarity; array of SubCategory refs
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  }],

  subCategoryId: [
  { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }
],

  suppliers: [{  // FIXED: Renamed to suppliers (array) for one-to-many; optional
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  }],

  
}, { timestamps: true });

categorySchema.index({ name: 'text' });

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);