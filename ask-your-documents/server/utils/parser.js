const pdfParse = require('pdf-parse');

/**
 * Parses the file content based on mime type or file extension.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalname - Original name of the file
 * @returns {Promise<string>} Parsed text content of the document
 */
async function parseDocument(buffer, originalname) {
  const extension = originalname.split('.').pop().toLowerCase();

  if (extension === 'txt' || extension === 'md') {
    const text = buffer.toString('utf-8');
    if (!text.trim()) {
      throw new Error(`The ${extension.toUpperCase()} file is empty.`);
    }
    return text;
  } else if (extension === 'json') {
    try {
      const text = buffer.toString('utf-8');
      const obj = JSON.parse(text);
      // Pretty print JSON to make it readable and chunkable
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  } else if (extension === 'pdf') {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;
      if (!text || !text.trim()) {
        throw new Error('The PDF file contains no readable text. Ensure it is not a scanned image.');
      }
      return text;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  } else {
    throw new Error('Unsupported file format. Only PDF, TXT, MD, and JSON files are allowed.');
  }
}

module.exports = { parseDocument };
