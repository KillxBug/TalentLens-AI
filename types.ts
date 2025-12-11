export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ProcessingState {
  isParsing: boolean;
  isThinking: boolean;
  isAnalyzing: boolean; // Background analysis
  isScanningATS: boolean; // Specific state for ATS Scan
  error: string | null;
}

export interface ResumeData {
  fileName: string;
  text: string;
  uploadDate: Date;
}

export interface ATSResult {
  score: number; // 0-100
  feedback: string;
  missingKeywords: string[];
}

// New interface for structured AI output
export interface ResumeAnalysis {
  candidateName: string;
  executiveSummary: string;
  topSkills: string[];
  suggestedQuestions: string[];
  atsResult?: ATSResult; // Optional until user clicks "Check"
}