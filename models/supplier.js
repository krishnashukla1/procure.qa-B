const mongoose = require('mongoose');
const validator = require('validator');

const supplierSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Supplier name is required'],
    minlength: [3, 'First name must be at least 3 characters long'],
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: 'Please provide a valid email address',
    },
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    minlength: [2, 'Company name must be at least 2 characters long'],
    trim: true,
  },
  companyType: {
    type: String,
  },
  companyLogo: {
    type: String,
    default: null,
  },
  officeAddress: {
    type: String,
    minlength: [10, 'Office address must be at least 10 characters long'],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: (value) => /^\d{3} \d{8}$/.test(value),
      message: 'Contact number must be in the format: XXX XXXXXXXXX (e.g., 974 55568329)',
    },
  },
  productCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  productSubCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

supplierSchema.index({ name: 'text' });
supplierSchema.index({ firstName: 'text' });  // NEW: For search
supplierSchema.index({ lastName: 'text' });   // NEW: For search

module.exports = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);