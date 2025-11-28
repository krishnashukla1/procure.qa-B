const express = require('express');
const { signup, getUsers, updateUser, deleteUser, login } = require('../controllers/userController');

const router = express.Router();

// POST /api/admin/users - Signup (add new user)
router.post('/users', signup);

// GET /api/admin/users - Get all users
router.get('/users', getUsers);

// PUT /api/admin/users/:id - Update a user by ID
router.put('/users/:id', updateUser);

// DELETE /api/admin/users/:id - Delete a user by ID
router.delete('/users/:id', deleteUser);

// POST /api/admin/login - Admin login
router.post('/login', login);

module.exports = router;