import express from 'express';
import { uploadImages, getAllImages, deleteImage, clearImages } from '../controllers/imageController.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// Upload multiple images
router.post('/upload', upload.array('images', 20), uploadImages);

// Get all images
router.get('/', getAllImages);

// Delete an image
router.delete('/:id', deleteImage);

// Clear all images
router.post('/clear', clearImages);

export default router;
