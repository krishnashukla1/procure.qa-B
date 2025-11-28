const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const signup = async (req, res) => {
  const { username, email, password, role, phoneNumber } = req.body;

  try {
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!username || !usernameRegex.test(username)) {
      return res.status(400).json({
        message: 'Username must be alphanumeric and between 3 to 20 characters long and without any space.',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,15}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be 8-15 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.and no any space',
      });
    }

    const validRoles = ['Admin', 'Sales'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be either "Admin" or "Sales"' });
    }

    const phoneRegex = /^\+974\s\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must be in the format "+974 xxxxxxxx"' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      code: 200,
      error: false,
      message: `${email} successfully added.`,
      token,
      createdAt: user.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: user.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    console.log('Signup successful, user added to database');
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Server error',
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { email, sortBy, page = 1, perPage = 10 } = req.query;

    const filter = {};
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    let sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(perPage, 10);

    const users = await User.find(filter, '-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(perPage, 10));

    const totalUsers = await User.countDocuments(filter);

    const totalPages = Math.ceil(totalUsers / perPage);

    const response = {
      code: 200,
      error: false,
      message: 'Users fetched successfully',
      pagination: {
        totalElements: totalUsers,
        totalPages,
        size: parseInt(perPage, 10),
        pageNo: parseInt(page, 10),
        numberOfElements: users.length,
      },
      data: {
        users,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Server error',
      pagination: null,
      data: null,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, phoneNumber } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) {
      const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          message: 'Username must be alphanumeric and between 3 to 20 characters long and without any space.',
        });
      }

      const usernameExists = await User.findOne({ username });
      if (usernameExists && usernameExists._id.toString() !== id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== id) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }

    if (role) {
      const validRoles = ['Admin', 'Sales'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Role must be either "Admin" or "Sales"' });
      }
      user.role = role;
    }

    if (phoneNumber) {
      const phoneRegex = /^\+974\s\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Phone number must be in the format "+974 xxxxxxxx"' });
      }
      user.phoneNumber = phoneNumber;
    }

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,15}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: 'Password must be 8-15 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        updatedAt: user.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user, please try again later' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user, please try again later' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        error: true,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    res.status(200).json({
      code: 200,
      error: false,
      message: 'Login successful',
      data: {
        token,
        loginTime,
      },
    });

    console.log('Login successful');
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: true,
      message: 'Server error',
      data: null,
    });
  }
};

module.exports = { signup, getUsers, updateUser, deleteUser, login };