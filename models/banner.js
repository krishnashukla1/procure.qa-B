const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  bannerImage: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
}, { timestamps: true });

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);