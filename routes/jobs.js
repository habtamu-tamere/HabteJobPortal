const express = require('express');
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all jobs (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, search, remote } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (location) filter.location = new RegExp(location, 'i');
    if (remote !== undefined) filter.isRemote = remote === 'true';
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    const jobs = await Job.find(filter)
      .populate('employer', 'name company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs.'
    });
  }
});

// Get single job by ID or shareable link
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let job;
    if (id.length === 24) { // MongoDB ObjectId
      job = await Job.findById(id).populate('employer', 'name company email phone');
    } else {
      job = await Job.findOne({ shareableLink: id }).populate('employer', 'name company email phone');
    }

    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job.'
    });
  }
});

// Create new job (employers only)
router.post('/', auth, requireRole(['employer']), async (req, res) => {
  try {
    const {
      title,
      description,
      company,
      location,
      type,
      salary,
      requirements,
      skills,
      applicationEmail,
      applicationUrl,
      isRemote,
      experienceLevel,
      postToTelegram
    } = req.body;

    const job = new Job({
      title,
      description,
      company: company || req.user.company,
      location,
      type,
      salary,
      requirements: Array.isArray(requirements) ? requirements : requirements?.split(',').map(r => r.trim()),
      skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()),
      applicationEmail,
      applicationUrl,
      employer: req.user._id,
      isRemote: isRemote || false,
      experienceLevel: experienceLevel || 'mid',
      postedToTelegram: postToTelegram || false,
      paymentAmount: postToTelegram ? 150 : 100
    });

    await job.save();
    await job.populate('employer', 'name company');

    // In a real implementation, you would integrate with Telebirr payment gateway here
    // For now, we'll simulate successful payment after 2 seconds
    setTimeout(async () => {
      job.paymentStatus = 'completed';
      job.telebirrTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await job.save();

      // If posting to Telegram is requested, simulate that too
      if (job.postedToTelegram) {
        job.telegramMessageId = `MSG-${Date.now()}`;
        job.postedToTelegram = true;
        await job.save();
        
        console.log(`Job posted to Telegram channel: ${job.title}`);
      }
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Job created successfully. Processing payment...',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job.'
    });
  }
});

// Update job (employer only)
router.put('/:id', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    // Check if the user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own jobs.'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      job[key] = updates[key];
    });

    await job.save();
    await job.populate('employer', 'name company');

    res.json({
      success: true,
      message: 'Job updated successfully.',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job.'
    });
  }
});

// Delete job (employer only)
router.delete('/:id', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    // Check if the user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own jobs.'
      });
    }

    await Job.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Job deleted successfully.'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting job.'
    });
  }
});

// Get employer's jobs
router.get('/employer/my-jobs', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const jobs = await Job.find({ employer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments({ employer: req.user._id });

    res.json({
      success: true,
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs.'
    });
  }
});

module.exports = router;
