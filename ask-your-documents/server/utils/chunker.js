/**
 * Splits document text into overlapping chunks along sentence boundaries.
 * Falls back to character-based slicing if a single sentence is larger than chunkSize.
 * 
 * @param {string} text - Cleaned source text
 * @param {number} chunkSize - Targeted size of each chunk in characters (default 500)
 * @param {number} chunkOverlap - Overlap size in characters (default 100)
 * @returns {Array<string>} List of text chunks
 */
function chunkText(text, chunkSize = 500, chunkOverlap = 100) {
  if (!text) return [];

  // Normalize whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  // Split text into sentences using simple regex
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g;
  let matches = cleanText.match(sentenceRegex);
  
  // If no sentences found, fallback to character splitting
  if (!matches || matches.length === 0) {
    return fallbackCharChunking(cleanText, chunkSize, chunkOverlap);
  }

  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (let i = 0; i < matches.length; i++) {
    const sentence = matches[i];
    
    // If a single sentence is larger than the chunkSize, chunk it by characters
    if (sentence.length > chunkSize) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('').trim());
        currentChunk = [];
        currentLength = 0;
      }
      
      const subChunks = fallbackCharChunking(sentence, chunkSize, chunkOverlap);
      chunks.push(...subChunks);
      continue;
    }

    if (currentLength + sentence.length > chunkSize) {
      chunks.push(currentChunk.join('').trim());
      
      // Implement sentence-based overlap
      // Keep adding previous sentences until we fill up the overlap budget
      const tempOverlap = [];
      let overlapLength = 0;
      for (let j = currentChunk.length - 1; j >= 0; j--) {
        if (overlapLength + currentChunk[j].length <= chunkOverlap) {
          tempOverlap.unshift(currentChunk[j]);
          overlapLength += currentChunk[j].length;
        } else {
          break;
        }
      }
      
      currentChunk = [...tempOverlap, sentence];
      currentLength = overlapLength + sentence.length;
    } else {
      currentChunk.push(sentence);
      currentLength += sentence.length;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('').trim());
  }

  return chunks.filter(c => c.length > 0);
}

function fallbackCharChunking(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.substring(index, index + chunkSize));
    index += (chunkSize - chunkOverlap);
    if (chunkSize <= chunkOverlap) break;
  }
  return chunks;
}

module.exports = { chunkText };
