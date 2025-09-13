const express = require('express');
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all jobs (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, search, remote } = req.query;
    
    // Build filter object
    const filter = { isActive:
