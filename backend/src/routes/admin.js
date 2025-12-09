const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { protect, authorize } = require('../middlewares/auth');

// @route   GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['admin', 'operator', 'viewer'].includes(role)) {
            res.status(400);
            throw new Error('Invalid role');
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.role = role;
        await user.save();
        res.json({ message: `Updated role to ${role}`, user: { _id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
