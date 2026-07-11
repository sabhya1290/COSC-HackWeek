# Premium Image Compression Analyzer

A professional full-stack web dashboard that allows users to upload images, compress them in real-time using high-efficiency quantization algorithms, inspect comparison metrics, and analyze technical metadata.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion, Axios, React Dropzone, Lucide Icons, html2pdf.js
- **Backend**: Node.js, Express, Sharp, Multer, Cors
- **Storage**: LocalStorage (client-side compression history log)

---

## Key Features

1. **Drag-and-Drop Uploader**: Fast uploading using `react-dropzone` with instant file rejection overlays for invalid formats.
2. **Instant Dynamic Compression**: Live slide adjustments (10% to 100%) that debounces requests to compress images immediately.
3. **Split Comparison Slider**: Interactive before/after wipe divider.
4. **Synchronized Zoom Viewer**: Pixel-level inspection comparison viewport that locks coordinate panning and zoom levels across both views.
5. **Statistics & Metrics**: Tracks original and compressed byte sizes, compression ratio, percentage saved, processing time, format, and estimated quality loss.
6. **Metadata Inspector**: Dynamic file profiling including chroma subsampling, alpha channel presence, and pixel density.
7. **Compression History Log**: Locally stored audit checklist allowing you to re-download or reload past compressions.
8. **Batch Compression Suite**: Upload multiple images, reorder files in the queue via drag-and-drop, apply presets, and download results in bulk.
9. **Accessibility & Keyboard Shortcuts**: Fully equipped with theme switcher, keyboard binders, and screen reader considerations.

---

## Project Structure

```text
image-compression-analyzer/
│
├── client/                 # Vite React Front-end
│   ├── src/
│   │   ├── components/     # Dropzone, Slider, Comparison, Metrics, History, Batch, Shortcuts
│   │   ├── App.jsx         # App Root Dashboard
│   │   ├── index.css       # Tailwind entry and Glassmorphic utility classes
│   │   └── main.jsx
│   └── package.json
│
└── server/                 # Node.js + Express Backend
    ├── routes/             # Compression router definitions
    ├── controllers/        # Sharp compression and metadata extractors
    ├── uploads/            # Temporary disk storage for uploads
    ├── compressed/         # Processed optimized files
    ├── index.js            # Express Entry point
    └── package.json
```

---

## Installation & Running Locally

### Prerequisites
- Node.js installed on your system.

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
The server will boot up on `http://localhost:5000`.

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
The client dashboard will load on `http://localhost:5173`.
