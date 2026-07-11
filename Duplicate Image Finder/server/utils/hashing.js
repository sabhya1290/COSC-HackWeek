import sharp from 'sharp';

/**
 * Computes 1D Discrete Cosine Transform II
 */
function dct1D(vector) {
  const N = vector.length;
  const output = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += vector[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
    }
    const factor = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
    output[k] = sum * factor;
  }
  return output;
}

/**
 * Computes 2D Discrete Cosine Transform on a square matrix (32x32)
 */
function dct2D(matrix, size = 32) {
  const tempMatrix = [];
  
  // Apply 1D DCT to each row
  for (let r = 0; r < size; r++) {
    const row = new Float64Array(size);
    for (let c = 0; c < size; c++) {
      row[c] = matrix[r * size + c];
    }
    tempMatrix.push(dct1D(row));
  }

  // Apply 1D DCT to each column of the resulting matrix
  const outputMatrix = new Float64Array(size * size);
  for (let c = 0; c < size; c++) {
    const col = new Float64Array(size);
    for (let r = 0; r < size; r++) {
      col[r] = tempMatrix[r][c];
    }
    const dctCol = dct1D(col);
    for (let r = 0; r < size; r++) {
      outputMatrix[r * size + c] = dctCol[r];
    }
  }

  return outputMatrix;
}

/**
 * Convert binary string (length 64) to 16-character hex string
 */
function binaryToHex(binaryStr) {
  let hex = '';
  for (let i = 0; i < binaryStr.length; i += 4) {
    const chunk = binaryStr.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

/**
 * Generate Average Hash (aHash)
 */
export async function getAHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < 64; i++) {
    sum += data[i];
  }
  const average = sum / 64;

  let binary = '';
  for (let i = 0; i < 64; i++) {
    binary += data[i] >= average ? '1' : '0';
  }

  return binaryToHex(binary);
}

/**
 * Generate Difference Hash (dHash)
 */
export async function getDHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let binary = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const left = data[r * 9 + c];
      const right = data[r * 9 + (c + 1)];
      binary += left > right ? '1' : '0';
    }
  }

  return binaryToHex(binary);
}

/**
 * Generate Perceptual Hash (pHash)
 */
export async function getPHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(32, 32, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Map buffer to float values
  const floatData = new Float64Array(1024);
  for (let i = 0; i < 1024; i++) {
    floatData[i] = data[i];
  }

  // Calculate 2D DCT
  const dct = dct2D(floatData, 32);

  // Take the top-left 8x8 coefficients
  const coefficients = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      coefficients.push(dct[r * 32 + c]);
    }
  }

  // Calculate median excluding the DC coefficient (0, 0) which is at index 0
  const subCoeffs = coefficients.slice(1);
  subCoeffs.sort((a, b) => a - b);
  const median = subCoeffs[Math.floor(subCoeffs.length / 2)];

  let binary = '';
  for (let i = 0; i < 64; i++) {
    binary += coefficients[i] >= median ? '1' : '0';
  }

  return binaryToHex(binary);
}

/**
 * Calculate Hamming Distance between two 16-character hex hashes
 */
export function getHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const val = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    let temp = val;
    while (temp > 0) {
      if (temp & 1) distance++;
      temp >>= 1;
    }
  }
  return distance;
}

/**
 * Calculate similarity percentage based on Hamming Distance
 */
export function getSimilarity(hash1, hash2) {
  const distance = getHammingDistance(hash1, hash2);
  return Math.round(((64 - distance) / 64) * 100);
}

/**
 * Generate all three hashes and metadata in a single fast, parallelized pipeline
 */
export async function getHashesAndMetadata(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Run all resizes in parallel in-memory using clones
  const [bufA, bufD, bufP] = await Promise.all([
    image.clone().resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer(),
    image.clone().resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer(),
    image.clone().resize(32, 32, { fit: 'fill' }).grayscale().raw().toBuffer()
  ]);

  // 1. Average Hash (aHash)
  let sumA = 0;
  for (let i = 0; i < 64; i++) {
    sumA += bufA[i];
  }
  const avgA = sumA / 64;
  let binA = '';
  for (let i = 0; i < 64; i++) {
    binA += bufA[i] >= avgA ? '1' : '0';
  }
  const aHash = binaryToHex(binA);

  // 2. Difference Hash (dHash)
  let binD = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      binD += bufD[r * 9 + c] > bufD[r * 9 + (c + 1)] ? '1' : '0';
    }
  }
  const dHash = binaryToHex(binD);

  // 3. Perceptual Hash (pHash)
  const floatData = new Float64Array(1024);
  for (let i = 0; i < 1024; i++) {
    floatData[i] = bufP[i];
  }
  const dct = dct2D(floatData, 32);
  const coefficients = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      coefficients.push(dct[r * 32 + c]);
    }
  }
  const subCoeffs = coefficients.slice(1).sort((a, b) => a - b);
  const median = subCoeffs[Math.floor(subCoeffs.length / 2)];
  let binP = '';
  for (let i = 0; i < 64; i++) {
    binP += coefficients[i] >= median ? '1' : '0';
  }
  const pHash = binaryToHex(binP);

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    aHash,
    dHash,
    pHash
  };
}

