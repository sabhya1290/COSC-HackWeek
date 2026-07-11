/**
 * Securely downloads a file by fetching as a blob first to bypass CORS restrictions
 * and browser navigation overrides on cross-origin anchor elements.
 * 
 * @param {string} url - The file download endpoint
 * @param {string} filename - The target filename to save as
 */
export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('File download system error:', error);
    // Fallback behavior
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
