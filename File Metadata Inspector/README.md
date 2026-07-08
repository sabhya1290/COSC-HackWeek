# MetaLens - File Metadata Inspector

**Creator**: [@sabhya1290](https://github.com/sabhya1290)

MetaLens is a modern, professional, frontend-only file utility dashboard designed to inspect and analyze file metadata locally in the browser before sharing files.

## Features

- **Drag-and-Drop Upload**: Simple files drop zone supporting multiple files simultaneously.
- **Image Metadata**:
  - Image preview.
  - Image dimensions (width and height in pixels).
  - Aspect ratio.
  - EXIF information (Camera make, model, date taken, GPS coordinates, and orientation).
- **PDF Metadata**:
  - PDF document icon indicator.
  - Live page counting.
- **Card-Based Dashboard**: Individual files are displayed as separate cards containing basic metadata tables.
- **Search & Filtering**: Real-time filtering by category (Images, PDFs) and name-based searching.
- **Metadata Actions**:
  - **Copy Info**: Copy raw metadata text to clipboard.
  - **JSON Export**: Download complete metadata details as a formatted JSON file.
  - **Removal & Clear All**: Manage and clear workspace contents with ease.
- **Local Storage History**: Safely saves metadata history between browser visits without saving large raw file payloads.
- **Visual Feedback**: Sleek toast notifications for all operations (copying, clearing, downloading, uploading).

## Technologies Used

- **HTML5 & CSS3**: Custom layout using CSS Grid, flexbox, and Outfit/Plus Jakarta Sans Google Fonts.
- **Vanilla JavaScript**: DOM manipulation, Browser File API, and LocalStorage APIs.
- **EXIF.js (via CDN)**: Reading image metadata files.
- **PDF.js (via CDN)**: Parsing PDF file binaries for page counting.

## Supported File Types

- **Images**: PNG, JPG, JPEG, WEBP
- **Documents**: PDF

## Setup & Running Instructions

1. Locate the [index.html](file:///d:/project/COSC Hackweek/File Metadata Inspector/index.html) file.
2. Double-click it to run locally in any browser or launch with **VS Code Live Server** extension for local hosting.

> [!NOTE]
> **Privacy First**: All calculations and files remain completely private. No file content is uploaded to any servers; everything is parsed locally in the browser.

> [!IMPORTANT]
> **EXIF & GPS Data**: EXIF records (camera specifications and geolocation details) are only visible if the uploaded image file contains EXIF tags inside its original metadata.
