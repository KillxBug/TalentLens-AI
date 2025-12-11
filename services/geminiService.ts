import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { ResumeAnalysis, ATSResult } from "../types";

let chatSession: Chat | null = null;
let currentResumeContext: string = "";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found: Check Netlify Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChatWithResume = async (resumeText: string) => {
  const ai = getAiClient();
  currentResumeContext = resumeText;

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
    model: "gemini-2.5-flash",
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
  const response = await chatSession.sendMessage(message);
  return response.text || "I processed the resume but couldn't generate a text response.";
};

export const analyzeInitialProfile = async (resumeText: string): Promise<ResumeAnalysis> => {
  const ai = getAiClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      candidateName: { type: Type.STRING },
      executiveSummary: { type: Type.STRING },
      topSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["candidateName", "executiveSummary", "topSkills", "suggestedQuestions"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Extract the candidate profile.\n\n${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  return JSON.parse(text) as ResumeAnalysis;
};

export const performATSScan = async (resumeText: string): Promise<ATSResult> => {
  const ai = getAiClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      feedback: { type: Type.STRING },
      missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["score", "feedback", "missingKeywords"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Act as a strict Applicant Tracking System (ATS).
      Analyze this resume.
      Scoring:
      - Keyword Density (40%)
      - Formatting & Readability (30%)
      - Quantifiable Impact (30%)
      RESUME: ${resumeText}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No ATS result generated");
  return JSON.parse(text) as ATSResult;
};

export const generateDeepCritique = async (resumeText: string): Promise<string> => {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Perform a deep critique. Focus on what is wrong with the resume. Be direct. RESUME: ${resumeText}`,
    config: {
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });

  return response.text || "Could not generate critique.";
};
