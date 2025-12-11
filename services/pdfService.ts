import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source using esm.sh which provides the ES Module version of the worker (`.mjs`).
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // We join with a space to preserve word separation.
      // Ideally, we would use item.hasEOL to insert newlines, but pdf.js text items are often fragmented.
      // Joining with space is a safe baseline for RAG, relying on the '--- Page X ---' markers for major separation.
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    // Return the text. We do NOT use .replace(/\s+/g, ' ') here because 
    // we want to preserve the newlines we explicitly added above for page separation.
    return fullText.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from the PDF. Please ensure the file is not corrupted or password protected.");
  }
};

export const extractTextFromTxt = async (file: File): Promise<string> => {
  const text = await file.text();
  return text.trim();
};