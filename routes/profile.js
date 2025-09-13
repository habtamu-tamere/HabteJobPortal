const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      profile: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile.'
    });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, phone, location, bio, skills, telebirrAccount, telegramUsername } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;
    if (skills) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (telebirrAccount) updateData.telebirrAccount = telebirrAccount;
    if (telegramUsername) updateData.telegramUsername = telegramUsername;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile.'
    });
  }
});

// Upload profile image (simulated)
router.post('/upload-image', auth, async (req, res) => {
  try {
    // In a real implementation, you would handle file upload here
    // For now, we'll just simulate the response
    
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile image updated successfully.',
      user
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile image.'
    });
  }
});

module.exports = router;
