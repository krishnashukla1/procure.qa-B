const Supplier = require('../models/supplier');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL;

// Helper to ensure directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const getAllSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const suppliers = await Supplier.find()
      .skip(skip)
      .limit(limit);

    const result = suppliers.map(supplier => ({
      id: supplier._id,
      firstName: supplier.firstName || 'N/A',
      lastName: supplier.lastName || 'N/A',
      companyName: supplier.companyName,
      companyType: supplier.companyType,
      companyLogo: supplier.companyLogo,
      officeAddress: supplier.officeAddress || 'Not available',
      contactNumber: supplier.contactNumber || 'Not available',
      email: supplier.email || 'Not available',
      createdAt: new Date(supplier.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date(supplier.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }));

    const totalSuppliers = await Supplier.countDocuments();
    const totalPages = Math.ceil(totalSuppliers / limit);

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Suppliers fetched successfully',
      pagination: {
        totalElements: totalSuppliers,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: suppliers.length,
      },
      data: {
        suppliers: result,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error fetching suppliers',
      pagination: null,
      data: null,
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
};

const createSupplier = async (req, res) => {
  const { name, officeAddress, companyName, contactNumber, email } = req.body;

  try {
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(409).json({ message: 'Email already exists. Please use a different email.' });
    }

    const newSupplier = new Supplier({
      firstName: name,
      officeAddress,
      contactNumber,
      email,
      companyName,
    });

    const savedSupplier = await newSupplier.save();

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: savedSupplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email must be unique', error: error.message });
    }
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, officeAddress, contactNumber, email, productCategories, productSubCategories } = req.body;

  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { firstName: name, officeAddress, contactNumber, email, productCategories, productSubCategories },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Supplier deleted successfully',
      supplier: deletedSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

const getSuppliersByName = async (req, res) => {
  const supplierName = req.query.name;
  const regex = new RegExp(supplierName, 'i');

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const suppliers = await Supplier.find({ firstName: { $regex: regex } })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'productCategories',
        select: 'name',
      })
      .populate({
        path: 'productSubCategories',
        select: 'name',
      })
      .populate({
        path: 'products',
        select: 'ProductName',
      });

    const totalSuppliers = await Supplier.countDocuments({ firstName: { $regex: regex } });
    const totalPages = Math.ceil(totalSuppliers / limit);
    const countPage = suppliers.length;

    if (!suppliers || suppliers.length === 0) {
      return res.status(404).json({ message: 'No suppliers found' });
    }

    const result = suppliers.map(supplier => ({
      id: supplier._id,
      name: supplier.firstName,
      productCategories: supplier.productCategories ? supplier.productCategories.map(category => category.name) : [],
      productSubCategories: supplier.productSubCategories ? supplier.productSubCategories.map(subcategory => subcategory.name) : [],
      products: supplier.products ? supplier.products.map(product => product.ProductName) : [],
    }));

    res.status(200).json({
      currentPage: page,
      totalPages,
      countPage,
      totalSuppliers,
      suppliers: result,
    });
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Error fetching suppliers' });
  }
};

const insertSupplier = async (req, res) => {
  try {
    upload.single('companyLogo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const {
        firstName,
        lastName,
        email,
        companyName,
        companyType,
        officeAddress,
        contactNumber,
      } = req.body;

      if (!firstName || !email || !companyName || !req.file || !contactNumber) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      const contactNumberRegex = /^\d{3} \d{8}$/;
      if (contactNumber && !contactNumberRegex.test(contactNumber)) {
        return res.status(400).json({ message: 'Contact number must be in the format: XXX XXXXXXXXX' });
      }

      const newSupplier = new Supplier({
        firstName,
        lastName: lastName || ' ',
        email,
        companyName,
        companyType,
        companyLogo: `${BASE_URL}/${req.file.path.replace(/\\/g, '/')}`,
        officeAddress,
        contactNumber,
      });

      const savedSupplier = await newSupplier.save();

      res.status(201).json({
        message: 'Supplier created successfully',
        supplier: savedSupplier,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating supplier',
      error: error.message,
    });
  }
};

// const getSuppliers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     // FIXED: Explicitly include _id in select; use .lean() for plain objects
//     const suppliers = await Supplier.find({})
//       .select('_id companyName companyType companyLogo')  // CRITICAL: Include _id
//       .skip(skip)
//       .limit(limit)
//       .lean()  // Faster, plain JS objects with _id as string
//       .sort({ companyName: 1 });  // Optional: Alphabetical

//     const totalSuppliers = await Supplier.countDocuments();
//     const totalPages = Math.ceil(totalSuppliers / limit);

//     // FIXED: Consistent structure: Wrap in data { suppliers } to match frontend fallback
//     res.status(200).json({
//       data: {  // Now supRes.data.data.suppliers works
//         suppliers: suppliers.map(sup => ({
//           _id: sup._id.toString(),  // Ensure string for frontend
//           companyName: sup.companyName,
//           companyType: sup.companyType,
//           companyLogo: sup.companyLogo,
//         })),
//       },
//       pagination: {
//         totalElements: totalSuppliers,
//         totalPages,
//         size: limit,
//         pageNo: page,
//         numberOfElements: suppliers.length,
//       },
//     });
//   } catch (error) {
//     console.error('❌ Error fetching suppliers:', error);
//     res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
//   }
// };

const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // FIXED: Include _id; handle if response uses 'id' (compatibility)
    const suppliers = await Supplier.find({})
      .select('_id companyName companyType companyLogo')  // CRITICAL: _id first
      .skip(skip)
      .limit(limit)
      .lean()
      .sort({ companyName: 1 });

    const totalSuppliers = await Supplier.countDocuments();
    const totalPages = Math.ceil(totalSuppliers / limit);

    // FIXED: Map with _id fallback to id; ensure string
    const mappedSuppliers = suppliers.map(sup => ({
      _id: (sup._id || sup.id)?.toString(),  // Fallback + string
      companyName: sup.companyName || 'Unknown',
      companyType: sup.companyType,
      companyLogo: sup.companyLogo,
    })).filter(sup => sup._id);  // Drop if still no _id

    console.log('🔧 Backend suppliers mapped:', mappedSuppliers.length, mappedSuppliers.slice(0, 1));  // Backend log

    res.status(200).json({
      data: {
        suppliers: mappedSuppliers,
      },
      pagination: {
        totalElements: totalSuppliers,
        totalPages,
        size: limit,
        pageNo: page,
        numberOfElements: mappedSuppliers.length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

const getSuppliersbyQuery = async (req, res) => {
  const { q } = req.query;

  try {
    const regex = q ? new RegExp(q, 'i') : {};

    // FIXED: Include _id in select
    const suppliers = await Supplier.find({ companyName: regex })
      .select('_id companyName companyType companyLogo')  // Include _id
      .lean();

    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'No suppliers found' });
    }

    // FIXED: Consistent structure
    res.status(200).json({
      data: {
        suppliers: suppliers.map(sup => ({
          _id: sup._id.toString(),
          companyName: sup.companyName,
          companyType: sup.companyType,
          companyLogo: sup.companyLogo,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersByName,
  insertSupplier,
  getSuppliers,
  getSuppliersbyQuery,
};