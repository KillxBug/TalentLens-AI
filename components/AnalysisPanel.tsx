import React, { useState } from 'react';
import { User, Lightbulb, CheckCircle, HelpCircle, Sparkles, BarChart3, Target, Scan, ShieldAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ResumeAnalysis } from '../types';

interface AnalysisPanelProps {
  analysis: ResumeAnalysis | null;
  isLoading: boolean;
  isScanning: boolean;
  onQuestionClick: (q: string) => void;
  onDeepCritique: () => void;
  onRunATS: () => void;
  isGreyMode?: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  analysis, 
  isLoading, 
  isScanning,
  onQuestionClick,
  onDeepCritique,
  onRunATS,
  isGreyMode = false
}) => {
  // Local state for tips toggle
  const [showAtsTips, setShowAtsTips] = useState(false);

  // Theme Variables
  const panelBg = isGreyMode ? 'bg-slate-900' : 'bg-gray-50';
  const textMain = isGreyMode ? 'text-gray-100' : 'text-gray-900';
  const textSub = isGreyMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isGreyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const buttonClass = isGreyMode 
    ? 'bg-slate-800 hover:bg-slate-700 text-gray-200 border-slate-700' 
    : 'bg-white hover:bg-indigo-50 text-gray-700 border-gray-200';
  const actionBtnClass = isGreyMode 
    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';
  const atsBtnClass = isGreyMode
    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
    : 'bg-emerald-600 hover:bg-emerald-700 text-white';

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className={`h-full ${panelBg} border-l ${isGreyMode ? 'border-slate-800' : 'border-gray-200'} p-6 flex flex-col items-center justify-center text-center`}>
        <div className="relative">
           <div className={`absolute inset-0 text-indigo-500 blur-lg opacity-20`}></div>
           <Sparkles className={`w-10 h-10 text-indigo-500 animate-pulse mb-4 relative z-10`} />
        </div>
        <h3 className={`${textMain} font-medium text-lg`}>Extracting Profile...</h3>
        <p className={`${textSub} text-sm mt-2`}>Parsing skills and history.</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className={`h-full ${panelBg} border-l ${isGreyMode ? 'border-slate-800' : 'border-gray-200'} overflow-y-auto p-6 transition-colors duration-300`}>
      
      {/* ATS Check Section */}
      <div className={`mb-6 p-4 rounded-xl ${cardBg} border shadow-sm relative overflow-hidden group`}>
        {!analysis.atsResult ? (
          <div className="text-center">
            {isScanning ? (
              <div className="flex flex-col items-center py-4">
                <div className="relative w-12 h-12 mb-3">
                  <Scan className="w-12 h-12 text-indigo-500 animate-pulse" />
                  <div className="scanning-line"></div>
                </div>
                <h3 className={`${textMain} font-bold`}>Running Diagnostic...</h3>
                <p className={`${textSub} text-xs mt-1`}>Auditing keywords & formatting</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <BarChart3 className={`w-5 h-5 ${isGreyMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <h3 className={`${textMain} font-bold`}>ATS Compatibility</h3>
                </div>
                <button 
                  onClick={onRunATS}
                  className={`w-full ${atsBtnClass} py-2.5 rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95`}
                >
                  <Scan className="w-4 h-4" />
                  Run ATS Diagnostic
                </button>
                <p className={`${textSub} text-[10px] mt-2 opacity-80`}>
                  Checks keyword density, parsing issues, and impact metrics.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className={`w-5 h-5 ${getScoreColor(analysis.atsResult.score)}`} />
                <h3 className={`font-bold ${textMain}`}>ATS Score</h3>
              </div>
              <span className={`text-2xl font-black ${getScoreColor(analysis.atsResult.score)}`}>
                {analysis.atsResult.score}/100
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-3 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${getScoreColor(analysis.atsResult.score).replace('text', 'bg')}`} 
                style={{ width: `${analysis.atsResult.score}%` }}
              ></div>
            </div>
            
            <p className={`text-xs ${textSub} flex items-start gap-1.5 mb-3`}>
              <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
              {analysis.atsResult.feedback}
            </p>

            {analysis.atsResult.missingKeywords && analysis.atsResult.missingKeywords.length > 0 && (
              <div className={`mt-3 pt-3 border-t ${isGreyMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <h4 className={`text-[10px] uppercase font-bold ${textSub} mb-1 flex items-center gap-1`}>
                  <ShieldAlert className="w-3 h-3" /> Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.atsResult.missingKeywords.map((k, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible General ATS Tips */}
        <div className={`mt-4 pt-3 border-t ${isGreyMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowAtsTips(!showAtsTips)}
            className={`flex items-center justify-between w-full text-xs font-medium ${isGreyMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors focus:outline-none`}
          >
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>General ATS Formatting Tips</span>
            </div>
            {showAtsTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAtsTips && (
            <ul className={`mt-3 space-y-2 text-[10px] ${textSub} animate-in slide-in-from-top-2 fade-in duration-200`}>
              <li className="flex gap-2">
                <span className={`w-1 h-1 rounded-full ${isGreyMode ? 'bg-indigo-400' : 'bg-indigo-500'} mt-1.5 flex-shrink-0`}></span>
                <span><strong>Simple Layouts:</strong> Avoid multi-column designs; standard left-to-right parsing is safest.</span>
              </li>
              <li className="flex gap-2">
                <span className={`w-1 h-1 rounded-full ${isGreyMode ? 'bg-indigo-400' : 'bg-indigo-500'} mt-1.5 flex-shrink-0`}></span>
                <span><strong>Standard Fonts:</strong> Use Ariel, Calibri, or Helvetica (10-12pt). Serif fonts can confuse OCR.</span>
              </li>
              <li className="flex gap-2">
                <span className={`w-1 h-1 rounded-full ${isGreyMode ? 'bg-indigo-400' : 'bg-indigo-500'} mt-1.5 flex-shrink-0`}></span>
                <span><strong>No Graphics:</strong> Tables, icons, graphs, and photos are often unreadable by older systems.</span>
              </li>
              <li className="flex gap-2">
                <span className={`w-1 h-1 rounded-full ${isGreyMode ? 'bg-indigo-400' : 'bg-indigo-500'} mt-1.5 flex-shrink-0`}></span>
                <span><strong>Section Headers:</strong> Use standard terms like "Experience" and "Education", not creative alternatives.</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Candidate Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <User className={`w-5 h-5 ${isGreyMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h2 className={`text-lg font-bold ${textMain}`}>{analysis.candidateName || "Candidate"}</h2>
        </div>
        <p className={`text-sm ${textSub} italic ${cardBg} p-3 rounded-lg border shadow-sm leading-relaxed`}>
          "{analysis.executiveSummary}"
        </p>
      </div>

      {/* Top Skills */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-xs font-bold ${isGreyMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Top Skills</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.topSkills.map((skill, idx) => (
            <span 
              key={idx} 
              className={`${isGreyMode ? 'bg-slate-800 border-slate-700 text-indigo-300' : 'bg-white border-indigo-100 text-indigo-700'} border text-xs px-3 py-1.5 rounded-md font-medium shadow-sm`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <h3 className={`text-xs font-bold ${isGreyMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Suggested Questions</h3>
        </div>
        <div className="space-y-2">
          {analysis.suggestedQuestions.map((q, idx) => (
            <button 
              key={idx}
              onClick={() => onQuestionClick(q)}
              className={`w-full text-left ${buttonClass} border p-3 rounded-lg text-xs transition-all shadow-sm group`}
            >
              <span className="group-hover:text-indigo-500 transition-colors">{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Critique Button */}
      <div className={`mt-auto pt-6 border-t ${isGreyMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <button 
          onClick={onDeepCritique}
          className={`w-full flex items-center justify-center gap-2 ${actionBtnClass} py-3 rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95`}
        >
          <Lightbulb className="w-4 h-4" />
          Perform Deep Critique
        </button>
        <p className={`text-center text-[10px] ${textSub} mt-2 opacity-70`}>
          Uses Gemini Thinking to analyze gaps & fit.
        </p>
      </div>
    </div>
  );
};