import { db } from '../services/db.js';
import { getHashesAndMetadata } from '../utils/hashing.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload endpoint controller
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processedImages = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;
        
        // Generate hashes and dimensions in one single-pass operation
        const data = await getHashesAndMetadata(filePath);

        const newImage = {
          id: file.filename.split('-')[0] || Math.random().toString(36).substr(2, 9),
          filename: file.originalname,
          filepath: `/uploads/${file.filename}`, // web-accessible path
          mime: file.mimetype,
          size: file.size,
          width: data.width,
          height: data.height,
          uploadedAt: new Date().toISOString(),
          hashes: {
            aHash: data.aHash,
            dHash: data.dHash,
            pHash: data.pHash
          }
        };

        db.addImage(newImage);
        processedImages.push(newImage);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        // Clean up uploaded file if processing failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    return res.status(201).json({
      message: 'Images processed successfully',
      images: processedImages
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all images
export const getAllImages = (req, res) => {
  try {
    const images = db.getImages();
    return res.json(images);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve images' });
  }
};

// Delete an image
export const deleteImage = (req, res) => {
  try {
    const { id } = req.params;
    const deletedImage = db.deleteImage(id);

    if (!deletedImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Attempt to delete physical file
    const rootDir = path.join(__dirname, '..');
    const fullPath = path.join(rootDir, deletedImage.filepath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    return res.json({ message: 'Image deleted successfully', id });
  } catch (error) {
    console.error('Delete controller error:', error);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Clear all images
export const clearImages = (req, res) => {
  try {
    const images = db.getImages();
    const rootDir = path.join(__dirname, '..');

    // Delete files
    images.forEach(img => {
      const fullPath = path.join(rootDir, img.filepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    db.clearAll();
    return res.json({ message: 'All images cleared successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear database' });
  }
};
