import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const compressImage = async (req, res) => {
  const startTime = performance.now();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const quality = parseInt(req.body.quality) || 80;
    const inputPath = req.file.path;
    const originalSize = req.file.size;

    // Use sharp to get original metadata
    const imageInfo = sharp(inputPath);
    const metadata = await imageInfo.metadata();

    const originalDimensions = {
      width: metadata.width,
      height: metadata.height
    };

    const originalFormat = metadata.format;

    // Prepare output filename
    const ext = path.extname(req.file.originalname) || `.${originalFormat}`;
    const nameWithoutExt = path.basename(req.file.originalname, ext);
    const compressedFilename = `${nameWithoutExt}_compressed_${quality}${ext}`;
    const outputPath = path.join(__dirname, '../compressed', compressedFilename);

    // Apply compression based on format
    let pipeline = sharp(inputPath);

    if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (originalFormat === 'png') {
      // png palette-based compression produces great size savings
      pipeline = pipeline.png({ quality, palette: true });
    } else if (originalFormat === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else {
      // Fallback
      pipeline = pipeline.toFormat(originalFormat, { quality });
    }

    await pipeline.toFile(outputPath);

    // Get compressed image metadata
    const compressedMetadata = await sharp(outputPath).metadata();
    const compressedSize = fs.statSync(outputPath).size;
    const endTime = performance.now();

    const timeTaken = Math.round(endTime - startTime);

    // Calculate metrics
    const savedBytes = originalSize - compressedSize;
    const savedPercentage = Math.max(0, parseFloat(((savedBytes / originalSize) * 100).toFixed(1)));
    const ratio = (originalSize / compressedSize).toFixed(1) + ':1';

    // Estimate quality loss (simple rule-based estimate based on requested quality)
    // For 100% quality, 0% loss. For 10% quality, 90% loss.
    const estimatedQualityLoss = `${100 - quality}%`;

    // Construct response
    res.json({
      originalSize,
      compressedSize,
      savedPercentage,
      ratio,
      dimensions: {
        original: `${originalDimensions.width} × ${originalDimensions.height}`,
        compressed: `${compressedMetadata.width} × ${compressedMetadata.height}`
      },
      format: originalFormat.toUpperCase(),
      compressedImageURL: `/compressed/${compressedFilename}`,
      timeTaken,
      estimatedQualityLoss,
      metadata: {
        space: metadata.space,
        channels: metadata.channels,
        hasProfile: !!metadata.hasProfile,
        hasAlpha: !!metadata.hasAlpha,
        density: metadata.density || 72,
        chromaSubsampling: metadata.chromaSubsampling || '4:2:0'
      }
    });

  } catch (error) {
    console.error('Compression Error:', error);
    res.status(500).json({ error: 'Failed to compress image. ' + error.message });
  }
};
