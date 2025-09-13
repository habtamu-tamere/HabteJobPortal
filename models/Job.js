const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  salary: {
    type: String,
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  applicationEmail: {
    type: String,
    required: true,
    trim: true
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'mid'
  },
  postedToTelegram: {
    type: Boolean,
    default: false
  },
  telegramMessageId: {
    type: String,
    default: null
  },
  shareableLink: {
    type: String,
    unique: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 100
  },
  telebirrTransactionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate shareable link before saving
jobSchema.pre('save', function(next) {
  if (!this.shareableLink) {
    const randomString = Math.random().toString(36).substring(2, 10);
    this.shareableLink = `job-${this.title.toLowerCase().replace(/\s+/g, '-')}-${randomString}`;
  }
  next();
});

// Index for better query performance
jobSchema.index({ employer: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, type: 1, location: 1 });

module.exports = mongoose.model('Job', jobSchema);
