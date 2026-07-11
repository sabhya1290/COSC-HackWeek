import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

class JSONDatabase {
  constructor() {
    this.data = {
      images: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Error initializing database, using in-memory fallback:', error);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  getImages() {
    return this.data.images;
  }

  getImage(id) {
    return this.data.images.find(img => img.id === id);
  }

  addImage(image) {
    this.data.images.push(image);
    this.save();
    return image;
  }

  deleteImage(id) {
    const idx = this.data.images.findIndex(img => img.id === id);
    if (idx !== -1) {
      const img = this.data.images[idx];
      this.data.images.splice(idx, 1);
      this.save();
      return img;
    }
    return null;
  }

  clearAll() {
    this.data.images = [];
    this.save();
  }
}

export const db = new JSONDatabase();
