const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    ProductName: {
      type: String,
      required: true,
      trim: true,
    },

    ItemCode: {
      type: String,
      required: true,
      unique: true,
    },

    Category: {
      CategoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      CategoryName: {
        type: String,
        required: true,
      },
    },

    SubCategory: {
      SubCategoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
        required: true,
      },
      SubCategoryName: {
        type: String,
        required: true,
      },
      CategoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    },

    Unit: {
      type: String,
      required: true,
    },

    Description: {
      type: String,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ ProductName: "text" });
productSchema.index({ "Category.CategoryName": 1 });
productSchema.index({ "SubCategory.SubCategoryName": 1 });
productSchema.index({ "supplierId.companyName": "text" });
productSchema.index({ ProductName: 1, ItemCode: 1 });
productSchema.index({ ItemCode: 1 }, { unique: true });

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
