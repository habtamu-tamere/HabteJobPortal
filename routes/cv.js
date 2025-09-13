const express = require('express');
const CV = require('../models/CV');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get user's CVs
router.get('/my-cvs', auth, async (req, res) => {
  try {
    const cvs = await CV.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      cvs
    });
  } catch (error) {
    console.error('Get CVs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching CVs.'
    });
  }
});

// Get CV by ID or shareable link
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let cv;
    if (id.length === 24) { // MongoDB ObjectId
      cv = await CV.findById(id).populate('userId', 'name email phone location');
    } else {
      cv = await CV.findOne({ shareableLink: id }).populate('userId', 'name email phone location');
    }

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found.'
      });
    }

    // If CV is not public and user is not the owner
    if (!cv.isPublic && (!req.user || cv.userId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This CV is private.'
      });
    }

    res.json({
      success: true,
      cv
    });
  } catch (error) {
    console.error('Get CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching CV.'
    });
  }
});

// Create new CV
router.post('/', auth, async (req, res) => {
  try {
    const {
      template,
      personalInfo,
      professionalSummary,
      experiences,
      education,
      skills,
      languages,
      certifications,
      projects
    } = req.body;

    // Check if user already has a CV with the same title
    const existingCV = await CV.findOne({ 
      userId: req.user._id, 
      'personalInfo.fullName': personalInfo.fullName 
    });

    if (existingCV) {
      return res.status(400).json({
        success: false,
        message: 'You already have a CV with this name. Please use a different name or edit the existing one.'
      });
    }

    const cv = new CV({
      userId: req.user._id,
      template,
      personalInfo,
      professionalSummary,
      experiences: experiences || [],
      education: education || [],
      skills: skills || [],
      languages: languages || [],
      certifications: certifications || [],
      projects: projects || []
    });

    await cv.save();

    // Simulate Telebirr payment processing
    setTimeout(async () => {
      cv.paymentStatus = 'completed';
      cv.telebirrTransactionId = `TXN-CV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await cv.save();
      console.log(`CV payment completed: ${cv.personalInfo.fullName}`);
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'CV created successfully. Processing payment...',
      cv
    });
  } catch (error) {
    console.error('Create CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating CV.'
    });
  }
});

// Update CV
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await CV.findById(id);

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found.'
      });
    }

    // Check if the user owns this CV
    if (cv.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own CVs.'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'userId' && key !== 'shareableLink') {
        cv[key] = updates[key];
      }
    });

    cv.lastUpdated = new Date();
    await cv.save();

    res.json({
      success: true,
      message: 'CV updated successfully.',
      cv
    });
  } catch (error) {
    console.error('Update CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating CV.'
    });
  }
});

// Delete CV
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await CV.findById(id);

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found.'
      });
    }

    // Check if the user owns this CV
    if (cv.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own CVs.'
      });
    }

    await CV.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'CV deleted successfully.'
    });
  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting CV.'
    });
  }
});

// Toggle CV visibility
router.patch('/:id/visibility', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    
    const cv = await CV.findById(id);

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found.'
      });
    }

    // Check if the user owns this CV
    if (cv.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own CVs.'
      });
    }

    cv.isPublic = isPublic;
    await cv.save();

    res.json({
      success: true,
      message: `CV is now ${isPublic ? 'public' : 'private'}.`,
      cv
    });
  } catch (error) {
    console.error('Toggle CV visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating CV visibility.'
    });
  }
});

module.exports = router;
