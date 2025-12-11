import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { ResumeAnalysis, ATSResult } from "../types";

let chatSession: Chat | null = null;
let currentResumeContext: string = '';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChatWithResume = async (resumeText: string) => {
  const ai = getAiClient();
  currentResumeContext = resumeText;

  // Improved System Prompt for better quality answers
  const systemInstruction = `
    You are an Expert Talent Analyst at a Fortune 500 company.
    
    You have been provided with the text of a resume (CV). Your goal is to provide deep, accurate, and actionable insights.

    RESUME CONTEXT:
    ${resumeText}
    
    GUIDELINES:
    1. Answer ONLY based on the resume.
    2. Be critical but fair.
    3. Keep answers concise and professional.
  `;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.2, 
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized.");
  }
  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "I processed the resume but couldn't generate a text response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from Gemini.");
  }
};

/**
 * Stage 1: Initial quick extraction of profile data.
 */
export const analyzeInitialProfile = async (resumeText: string): Promise<ResumeAnalysis> => {
  const ai = getAiClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      candidateName: { type: Type.STRING, description: "The full name of the candidate found in the resume header." },
      executiveSummary: { type: Type.STRING, description: "A professional, 3rd-person summary of the candidate's profile (max 30 words)." },
      topSkills: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "A list of the top 5 hard skills mentioned." 
      },
      suggestedQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 highly specific, probing interview questions based on unique details."
      },
    },
    required: ["candidateName", "executiveSummary", "topSkills", "suggestedQuestions"],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract the candidate profile. \n\n${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  
  return JSON.parse(text) as ResumeAnalysis;
};

/**
 * Stage 2: Detailed ATS Audit triggered manually.
 */
export const performATSScan = async (resumeText: string): Promise<ATSResult> => {
  const ai = getAiClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "Strict score 0-100 based on keyword match, quantifiability, and formatting." },
      feedback: { type: Type.STRING, description: "Professional feedback sentence explaining the score." },
      missingKeywords: { 
        type: Type.ARRAY, 
        items: {type: Type.STRING}, 
        description: "List of 3 important industry keywords or skills that seem missing or under-emphasized." 
      }
    },
    required: ["score", "feedback", "missingKeywords"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Act as a strict Applicant Tracking System (ATS) algorithm. 
      Analyze this resume text. 
      
      Scoring Criteria:
      - Keyword Density (40%)
      - Formatting & Readability (30%)
      - Quantifiable Impact (Metrics) (30%)
      
      Be rigorous. Most resumes should fall between 40-70. Only exceptional ones get >80.
      
      RESUME: ${resumeText}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No ATS result generated");
  return JSON.parse(text) as ATSResult;
};

export const generateDeepCritique = async (resumeText: string): Promise<string> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', 
    contents: `Perform a deep critique. Focus on what is WRONG with the resume. Be direct. RESUME: ${resumeText}`,
    config: {
      thinkingConfig: { thinkingBudget: 2048 }, 
    }
  });

  return response.text || "Could not generate critique.";
};