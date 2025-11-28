// clientController.js - Full Corrected Backend Code
const Client = require('../models/client');
const Product = require('../models/product');
const SubCategory = require('../models/subCategory');
const Supplier = require('../models/supplier');
const validator = require('validator');
const mongoose = require('mongoose');

// Get all clients with pagination and population
const getAllClients = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  try {
    console.log('📦 Fetching clients with params:', { page, limit, search });
   
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNo: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const clients = await Client.find(searchQuery)
      .populate('product', 'ItemCode ProductName')
      .populate('subCategory', 'name')
      .populate('supplier', 'companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    const totalClients = await Client.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalClients / limitNum);
    console.log('✅ Clients fetched successfully:', clients.length);
   
    res.status(200).json({
      code: 200,
      error: false,
      message: 'Clients fetched successfully',
      pagination: {
        totalElements: totalClients,
        totalPages,
        size: limitNum,
        pageNo: pageNum,
        numberOfElements: clients.length,
      },
      data: {
        clients,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error fetching clients: ' + error.message,
      pagination: null,
      data: null,
    });
  }
};

// Create new client - Enhanced with full validation, population, and consistent response
const createClient = async (req, res) => {
  const { name, companyName, phoneNo, email, product, subCategory, supplier } = req.body;
  console.log('📝 Creating client with data:', { name, companyName, phoneNo, email, product, subCategory, supplier });
  
  try {
    // Validation: Required fields
    if (!name || !companyName || !phoneNo || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'All fields (name, companyName, phoneNo, email) are required',
        data: null,
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'Invalid email format',
        data: null,
      });
    }

    // Check for existing client with same email
    console.log('🔍 Checking for existing client with email:', email);
    const existingClient = await Client.findOne({ email: email.toLowerCase().trim() });
    if (existingClient) {
      console.log('❌ Client with email already exists:', email);
      return res.status(409).json({
        code: 409,
        error: true,
        message: 'Client with this email already exists',
        data: null,
      });
    }
    console.log('✅ No duplicate email found');

    // Validate ObjectIds if provided
    if (product && !mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ code: 400, error: true, message: 'Invalid product ID', data: null });
    }
    if (subCategory && !mongoose.Types.ObjectId.isValid(subCategory)) {
      return res.status(400).json({ code: 400, error: true, message: 'Invalid subCategory ID', data: null });
    }
    if (supplier && !mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({ code: 400, error: true, message: 'Invalid supplier ID', data: null });
    }

    // Validate references existence if provided
    if (product) {
      console.log('🔍 Validating product:', product);
      const productExists = await Product.findById(product);
      if (!productExists) {
        console.log('❌ Invalid Product ID:', product);
        return res.status(404).json({ code: 404, error: true, message: 'Invalid Product ID', data: null });
      }
    }
    if (subCategory) {
      console.log('🔍 Validating subCategory:', subCategory);
      const subCategoryExists = await SubCategory.findById(subCategory);
      if (!subCategoryExists) {
        console.log('❌ Invalid SubCategory ID:', subCategory);
        return res.status(404).json({ code: 404, error: true, message: 'Invalid SubCategory ID', data: null });
      }
    }
    if (supplier) {
      console.log('🔍 Validating supplier:', supplier);
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        console.log('❌ Invalid Supplier ID:', supplier);
        return res.status(404).json({ code: 404, error: true, message: 'Invalid Supplier ID', data: null });
      }
    }
    console.log('✅ All validations passed, creating client...');

    // Create new client with trimming/normalization
    const newClient = await Client.create({
      name: name.trim(),
      companyName: companyName.trim(),
      phoneNo: phoneNo.trim(),
      email: email.toLowerCase().trim(),
      product: product || null,
      subCategory: subCategory || null,
      supplier: supplier || null,
    });
    console.log('✅ Client created successfully:', newClient._id);

    // Populate the created client (consistent with GET/UPDATE)
    const populatedClient = await Client.findById(newClient._id)
      .populate('product', 'ItemCode ProductName')
      .populate('subCategory', 'name')
      .populate('supplier', 'companyName');
    console.log('✅ Client populated successfully');

    // Consistent response structure
    res.status(201).json({
      code: 201,
      error: false,
      message: 'Client created successfully',
      data: { client: populatedClient },
    });
  } catch (error) {
    console.error('❌ Error creating client:', error);
    console.error('❌ Error stack:', error.stack);

    // More specific error messages
    let errorMessage = 'Error creating client';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation Error: ${Object.values(error.errors).map(e => e.message).join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate email address';
    } else {
      errorMessage += ': ' + error.message;
    }

    res.status(500).json({
      code: 500,
      error: true,
      message: errorMessage,
      data: null,
    });
  }
};

// Update client
const updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, companyName, phoneNo, email, product, subCategory, supplier } = req.body;
  console.log('🔄 Updating client:', id, 'with data:', req.body);
  try {
    // Find existing client
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      console.log('❌ Client not found:', id);
      return res.status(404).json({
        code: 404,
        error: true,
        message: 'Client not found',
        data: null,
      });
    }
    console.log('✅ Client found:', existingClient.email);
    // Validation
    if (!name || !companyName || !phoneNo || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'All fields are required',
        data: null,
      });
    }
    if (!validator.isEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'Invalid email format',
        data: null,
      });
    }
    // Check for duplicate email (excluding current client)
    const duplicateClient = await Client.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: id }
    });
   
    if (duplicateClient) {
      console.log('❌ Duplicate email found:', email);
      return res.status(409).json({
        code: 409,
        error: true,
        message: 'Client with this email already exists',
        data: null,
      });
    }
    console.log('✅ No duplicate email');
    // Validate references if provided
    if (product) {
      console.log('🔍 Validating product:', product);
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({
          code: 404,
          error: true,
          message: 'Invalid Product ID',
          data: null,
        });
      }
    }
    if (subCategory) {
      console.log('🔍 Validating subCategory:', subCategory);
      const subCategoryExists = await SubCategory.findById(subCategory);
      if (!subCategoryExists) {
        return res.status(404).json({
          code: 404,
          error: true,
          message: 'Invalid SubCategory ID',
          data: null,
        });
      }
    }
    if (supplier) {
      console.log('🔍 Validating supplier:', supplier);
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return res.status(404).json({
          code: 404,
          error: true,
          message: 'Invalid Supplier ID',
          data: null,
        });
      }
    }
    console.log('✅ All validations passed, updating client...');
    // Update client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        companyName: companyName.trim(),
        phoneNo: phoneNo.trim(),
        email: email.toLowerCase().trim(),
        product: product || null,
        subCategory: subCategory || null,
        supplier: supplier || null,
      },
      { new: true, runValidators: true }
    ).populate('product', 'ItemCode ProductName')
     .populate('subCategory', 'name')
     .populate('supplier', 'companyName');
    console.log('✅ Client updated successfully');
    res.status(200).json({
      code: 200,
      error: false,
      message: 'Client updated successfully',
      data: { client: updatedClient },
    });
  } catch (error) {
    console.error('❌ Error updating client:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error updating client: ' + error.message,
      data: null,
    });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Deleting client:', id);
  try {
    const client = await Client.findById(id);
   
    if (!client) {
      console.log('❌ Client not found for deletion:', id);
      return res.status(404).json({
        code: 404,
        error: true,
        message: 'Client not found',
        data: null,
      });
    }
    await Client.findByIdAndDelete(id);
    console.log('✅ Client deleted successfully:', id);
    res.status(200).json({
      code: 200,
      error: false,
      message: 'Client deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error deleting client: ' + error.message,
      data: null,
    });
  }
};

// Get client by ID
const getClientById = async (req, res) => {
  const { id } = req.params;
  console.log('🔍 Getting client by ID:', id);
  try {
    const client = await Client.findById(id)
      .populate('product', 'ItemCode ProductName')
      .populate('subCategory', 'name')
      .populate('supplier', 'companyName');
    if (!client) {
      console.log('❌ Client not found:', id);
      return res.status(404).json({
        code: 404,
        error: true,
        message: 'Client not found',
        data: null,
      });
    }
    console.log('✅ Client found:', client.email);
    res.status(200).json({
      code: 200,
      error: false,
      message: 'Client fetched successfully',
      data: { client },
    });
  } catch (error) {
    console.error('❌ Error fetching client:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Error fetching client: ' + error.message,
      data: null,
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};