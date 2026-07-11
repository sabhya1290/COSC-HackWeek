# Duplicate Image Finder

A production-quality Duplicate & Visually Similar Image Finder that detects duplicate and visually similar images using perceptual and average hashing techniques. The application allows users to upload multiple images, compare them efficiently, and display matching images along with their similarity percentage.

## Deploy Links
- **Frontend App**: [https://duplicateimagefinder.vercel.app/](https://duplicateimagefinder.vercel.app/)


## Features
- **Multiple Image Upload**: Drag & Drop, JPG, PNG, WEBP, up to 10MB per file.
- **Perceptual Image Hashing**:
  - Average Hash (`aHash`)
  - Difference Hash (`dHash`)
  - Perceptual Hash (`pHash`)
- **Duplicate & Similar Detection**: Calculates Hamming Distance and Similarity Percentage.
- **Interactive Dashboard**:
  - Live similarity threshold slider (50% - 100%).
  - Live filtering (Exact Duplicates, Similar Images, Unique Images).
  - Search by filename.
  - Sorting (Highest/Lowest Similarity, Name, File Size).
  - Stat counters (Potential Storage Saved, Total Images, duplicates/similar counts).
- **Side-by-Side Comparison**: Details Modal with Canvas-based spatial pixel difference heatmap.
- **Exporting Options**: Export results to CSV, JSON, or printable PDF.
- **Premium Design System**: Dark/Light mode, clean animations, responsive layout.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS v4 + Lucide Icons
- **Backend**: Node.js + Express.js + Multer
- **Image Processing**: Sharp (implemented optimized parallel in-memory hashing pipelines)

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)

### Setup & Running Locally

1. **Clone the project & go to directory**:
   ```bash
   cd "Duplicate Image Finder"
   ```

2. **Run Backend Server**:
   ```bash
   cd server
   # Install dependencies
   npm install
   # Start the server (runs on port 5000)
   npm start
   ```

3. **Run Frontend Client**:
   ```bash
   cd ../client
   # Install dependencies
   npm install
   # Start the Vite development server
   npm run dev
   ```

4. **Access the application**:
   Open your browser to [http://localhost:5173/](http://localhost:5173/)

## Folder Structure

```
client/
  src/
    App.jsx      # Main application logic and UI
    index.css    # Tailwind CSS configuration and themes
    main.jsx     # Entry point
  index.html
  package.json
  vite.config.js

server/
  controllers/
    imageController.js  # Handle uploads, deletion and retrieval
  routes/
    imageRoutes.js      # Express API endpoints
  services/
    db.js               # JSON based storage service
  uploads/              # Target folder for uploaded images
  utils/
    hashing.js          # Implemented aHash, dHash, pHash & Hamming distance
    multer.js           # Multer uploads configuration
  index.js              # Express server startup
  package.json
```

## Hashing Method Analysis
- **Average Hash (aHash)**: Fast but prone to false positives. Good for simple resizing.
- **Difference Hash (dHash)**: Tracks gradients between neighboring pixels. Very fast and accurate for aspect changes.
- **Perceptual Hash (pHash)**: Converts image to frequency domain using Discrete Cosine Transform (DCT). Most robust to compression, brightness changes, color shifts, and minor distortions.
