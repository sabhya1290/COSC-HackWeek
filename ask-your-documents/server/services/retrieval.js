/**
 * TF-IDF Cosine Similarity Retrieval System
 */

// Helper to tokenize and clean text
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// Computes frequency of each token in a list of tokens
function getTermFrequencies(tokens) {
  const freqs = {};
  for (const token of tokens) {
    freqs[token] = (freqs[token] || 0) + 1;
  }
  return freqs;
}

/**
 * Retrieves top K relevant chunks for a given query using TF-IDF cosine similarity.
 * @param {string} query - User question
 * @param {Array<{text: string, docName: string}>} chunks - All document chunks stored in memory
 * @param {number} topK - Number of chunks to retrieve (default 3)
 * @returns {Array<{text: string, docName: string, score: number}>} Selected top chunks
 */
function retrieveChunks(query, chunks, topK = 3) {
  if (!chunks || chunks.length === 0) return [];
  
  const N = chunks.length;
  
  // 1. Tokenize query and all chunks
  const queryTokens = tokenize(query);
  const queryTF = getTermFrequencies(queryTokens);
  
  const chunkTokensList = chunks.map(chunk => tokenize(chunk.text));
  const chunkTFs = chunkTokensList.map(tokens => getTermFrequencies(tokens));
  
  // 2. Compute Document Frequency (DF) for terms in the vocabulary (query terms + chunk terms)
  const df = {};
  
  // We only care about words that appear in either the query or any chunk
  const vocab = new Set([...queryTokens]);
  for (const tokens of chunkTokensList) {
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      vocab.add(token);
      df[token] = (df[token] || 0) + 1;
    }
  }
  
  // 3. Compute Inverse Document Frequency (IDF)
  const idf = {};
  for (const term of vocab) {
    const docFreq = df[term] || 0;
    // Standard IDF formula with smoothing to avoid log(0) and division by zero
    idf[term] = Math.log(1 + (N / (1 + docFreq)));
  }
  
  // 4. Calculate TF-IDF vectors
  // Query TF-IDF vector
  const queryVec = {};
  for (const term of queryTokens) {
    queryVec[term] = queryTF[term] * idf[term];
  }
  
  // Compute cosine similarities
  const scoredChunks = chunks.map((chunk, index) => {
    const chunkTF = chunkTFs[index];
    const chunkVec = {};
    
    // We only need to check terms that exist in both vectors (or at least one)
    // To make it efficient, build chunk vector for terms in vocab
    for (const term in chunkTF) {
      chunkVec[term] = chunkTF[term] * idf[term];
    }
    
    // Cosine Similarity: dotProduct(A, B) / (mag(A) * mag(B))
    let dotProduct = 0;
    let magQuery = 0;
    let magChunk = 0;
    
    // Union of terms in queryVec and chunkVec
    const vectorTerms = new Set([...Object.keys(queryVec), ...Object.keys(chunkVec)]);
    
    for (const term of vectorTerms) {
      const qVal = queryVec[term] || 0;
      const cVal = chunkVec[term] || 0;
      
      dotProduct += qVal * cVal;
      magQuery += qVal * qVal;
      magChunk += cVal * cVal;
    }
    
    magQuery = Math.sqrt(magQuery);
    magChunk = Math.sqrt(magChunk);
    
    const score = (magQuery === 0 || magChunk === 0) ? 0 : (dotProduct / (magQuery * magChunk));
    
    return {
      ...chunk,
      score
    };
  });
  
  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  
  return scoredChunks.slice(0, topK);
}

module.exports = { retrieveChunks };
