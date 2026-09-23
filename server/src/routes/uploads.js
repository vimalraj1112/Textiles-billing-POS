const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  upload.array('images', 6),
  (req, res) => {
    const files = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.status(201).json({
      success: true,
      message: files.length ? 'Files uploaded' : 'No files uploaded',
      data: files,
    });
  }
);

module.exports = router;