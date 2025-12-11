import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { ResumeData } from '../types';
import { extractTextFromPdf, extractTextFromTxt } from '../services/pdfService';

interface FileUploaderProps {
  onUploadSuccess: (data: ResumeData) => void;
  onUploadStart: () => void;
  onUploadError: (msg: string) => void;
  isProcessing: boolean;
  isGreyMode?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadSuccess, 
  onUploadStart, 
  onUploadError,
  isProcessing,
  isGreyMode = false
}) => {

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onUploadStart();

    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(file);
      } else if (file.type === 'text/plain') {
        extractedText = await extractTextFromTxt(file);
      } else {
        throw new Error("Unsupported file type. Please upload PDF or TXT.");
      }

      if (extractedText.trim().length === 0) {
        throw new Error("The file appears to be empty or text could not be extracted (e.g., scanned image PDF).");
      }

      onUploadSuccess({
        fileName: file.name,
        text: extractedText,
        uploadDate: new Date(),
      });

    } catch (err: any) {
      onUploadError(err.message || "An error occurred processing the file.");
    }
  }, [onUploadStart, onUploadSuccess, onUploadError]);

  // Theme Classes
  const borderClass = isGreyMode ? 'border-gray-400 hover:border-gray-600' : 'border-indigo-200 hover:border-indigo-400';
  const iconBgClass = isGreyMode ? 'bg-gray-200' : 'bg-indigo-50';
  const iconColorClass = isGreyMode ? 'text-gray-700' : 'text-indigo-600';
  const buttonClass = isGreyMode 
    ? 'bg-gray-800 hover:bg-gray-900 text-white' 
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div className={`border-2 border-dashed ${borderClass} rounded-xl bg-white/80 backdrop-blur-sm p-10 flex flex-col items-center justify-center text-center shadow-sm transition-colors relative`}>
        
        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className={`w-12 h-12 ${iconColorClass} animate-spin mb-4`} />
            <p className="text-gray-600 font-medium">Analyzing Resume...</p>
            <p className="text-gray-400 text-sm mt-1">Extracting text and preparing AI context</p>
          </div>
        ) : (
          <>
            <div className={`${iconBgClass} p-4 rounded-full mb-4`}>
              <Upload className={`w-8 h-8 ${iconColorClass}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Candidate Resume</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Support for PDF or TXT files. <br/> 
              The AI will read the file and let you chat with it.
            </p>
            
            <label className="relative cursor-pointer">
              <span className={`${buttonClass} px-6 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95 flex items-center gap-2`}>
                <FileText className="w-4 h-4" />
                Select File
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};