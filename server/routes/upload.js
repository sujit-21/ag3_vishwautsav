const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinaryConfig');

// Upload a single image
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // req.file.path contains the secure URL provided by Cloudinary
    res.status(200).json({ 
      message: 'Image uploaded successfully', 
      imageUrl: req.file.path 
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
});

module.exports = router;
