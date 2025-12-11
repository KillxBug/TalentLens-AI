import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, FileText, AlertTriangle, PanelRightClose, PanelRightOpen, Download, Moon, Sun, Heart, Candy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Message, ProcessingState, ResumeData, ResumeAnalysis } from './types';
import { FileUploader } from './components/FileUploader';
import { ChatMessage } from './components/ChatMessage';
import { AnalysisPanel } from './components/AnalysisPanel';
import { initializeChatWithResume, sendMessageToGemini, analyzeInitialProfile, performATSScan, generateDeepCritique } from './services/geminiService';

const App: React.FC = () => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [input, setInput] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isGreyMode, setIsGreyMode] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{id: number, left: number, emoji: string}[]>([]);
  
  const [status, setStatus] = useState<ProcessingState>({
    isParsing: false,
    isThinking: false,
    isAnalyzing: false,
    isScanningATS: false,
    error: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const triggerConfetti = (score: number) => {
    const duration = 3000;
    const end = Date.now() + duration;

    if (score >= 90) {
      // Big Celebration
      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10B981', '#3B82F6', '#F59E0B']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10B981', '#3B82F6', '#F59E0B']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else if (score >= 70) {
      // Moderate Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      // Small encouragement
       confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#9CA3AF', '#FCD34D']
       });
    }
  };

  const handleCandyClick = () => {
    // Add floating emoji animation
    const id = Date.now();
    const emojis = ['🍬', '🍭', '🍫', '✨', '🤖', '❤️'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const randomLeft = Math.random() * 80 + 10; // 10% to 90%

    setFloatingEmojis(prev => [...prev, { id, left: randomLeft, emoji: randomEmoji }]);
    
    // Remove after animation
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1000);

    // Also trigger a small confetti burst
    confetti({
      particleCount: 15,
      spread: 30,
      origin: { y: 0.15, x: 0.5 },
      colors: ['#EC4899', '#8B5CF6']
    });
  };

  const handleUploadStart = () => {
    setStatus({ isParsing: true, isThinking: false, isAnalyzing: false, isScanningATS: false, error: null });
  };

  const handleUploadError = (msg: string) => {
    setStatus({ isParsing: false, isThinking: false, isAnalyzing: false, isScanningATS: false, error: msg });
  };

  const handleUploadSuccess = async (data: ResumeData) => {
    setResume(data);
    setStatus(prev => ({ ...prev, isParsing: false, isAnalyzing: true }));
    
    try {
      await initializeChatWithResume(data.text);
      setMessages([
        {
          id: 'system-welcome',
          role: 'model',
          text: `I've loaded **${data.fileName}**. I'm analyzing it for insights now...`,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      setStatus(prev => ({ ...prev, error: "Failed to initialize chat." }));
    }

    try {
      // Step 1: Just get the profile first (Name, Skills, Questions)
      const analysisData = await analyzeInitialProfile(data.text);
      setAnalysis(analysisData);
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setStatus(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleATSCheck = async () => {
    if (!resume || !analysis) return;
    setStatus(prev => ({ ...prev, isScanningATS: true }));
    
    try {
      // Step 2: Strict ATS Audit
      const atsResult = await performATSScan(resume.text);
      setAnalysis(prev => prev ? ({ ...prev, atsResult }) : null);
      triggerConfetti(atsResult.score);
    } catch (e) {
      setStatus(prev => ({ ...prev, error: "ATS Scan failed. Please try again." }));
    } finally {
      setStatus(prev => ({ ...prev, isScanningATS: false }));
    }
  };

  const handleReset = () => {
    setResume(null);
    setMessages([]);
    setAnalysis(null);
    setInput('');
    setStatus({ isParsing: false, isThinking: false, isAnalyzing: false, isScanningATS: false, error: null });
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !resume || status.isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setStatus(prev => ({ ...prev, isThinking: true, error: null }));

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setStatus(prev => ({ ...prev, error: "Failed to get a response. Please try again." }));
    } finally {
      setStatus(prev => ({ ...prev, isThinking: false }));
    }
  };

  const handleDeepCritique = async () => {
    if (!resume || status.isThinking) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: "Perform a deep critique of this resume.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setStatus(prev => ({ ...prev, isThinking: true }));

    try {
      const critique = await generateDeepCritique(resume.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: critique,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setStatus(prev => ({ ...prev, error: "Critique failed." }));
    } finally {
      setStatus(prev => ({ ...prev, isThinking: false }));
    }
  };

  if (!process.env.API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Missing API Key</h1>
          <p className="text-gray-600">Please ensure the <code>process.env.API_KEY</code> is set.</p>
        </div>
      </div>
    );
  }

  // Theme Colors - Enhanced Dark Mode
  const mainBgClass = isGreyMode ? 'bg-texture-dark' : 'bg-gray-50 bg-grid-pattern';
  const headerBgClass = isGreyMode ? 'bg-slate-900/90 backdrop-blur-md border-slate-800' : 'bg-white border-gray-200';
  const headerTextClass = isGreyMode ? 'text-gray-100' : 'text-gray-900';
  const accentBgClass = isGreyMode ? 'bg-indigo-500' : 'bg-indigo-600';
  const buttonHoverBg = isGreyMode ? 'hover:bg-slate-800' : 'hover:bg-indigo-50';
  const buttonText = isGreyMode ? 'text-gray-300' : 'text-indigo-600';
  const iconColor = isGreyMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex flex-col h-screen ${mainBgClass} transition-colors duration-500`}>
      {/* Floating Emojis Overlay */}
      {floatingEmojis.map(item => (
        <div 
          key={item.id} 
          className="animate-float-emoji text-2xl"
          style={{ left: `${item.left}%`, bottom: '10%' }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Header */}
      <header className={`${headerBgClass} border-b px-4 py-3 flex items-center justify-between flex-shrink-0 z-20 shadow-sm transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <div className={`${accentBgClass} p-2 rounded-lg shadow-sm transition-colors`}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${headerTextClass} leading-tight`}>TalentLens AI</h1>
            <p className={`text-xs ${isGreyMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>Professional Talent Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Candy Button */}
           <button 
             onClick={handleCandyClick}
             className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${isGreyMode ? 'bg-slate-800 text-pink-400 hover:bg-slate-700' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
             title="Thanks the AI"
           >
             <Candy className="w-3.5 h-3.5" />
             Give Candy
           </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className={`text-sm ${buttonHoverBg} ${buttonText} flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsGreyMode(!isGreyMode)}
            className={`p-2 rounded-md ${buttonHoverBg} ${iconColor} transition-colors`}
            title={isGreyMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isGreyMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {resume && (
            <>
              <button 
                onClick={() => setShowPanel(!showPanel)}
                className={`lg:hidden ${iconColor} hover:bg-gray-100/10 p-2 rounded-md`}
              >
                {showPanel ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
              <button 
                onClick={handleReset}
                className={`text-sm ${iconColor} hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-md ${buttonHoverBg} transition-colors`}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">New Upload</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex relative overflow-hidden">
        
        {/* Congratulations Overlay for score > 90 */}
        {analysis?.atsResult && analysis.atsResult.score >= 90 && !status.isScanningATS && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 flex items-center justify-center">
             <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-5"></div>
          </div>
        )}
        
        {status.error && (
          <div className="absolute top-4 left-0 right-0 z-50 px-4 pointer-events-none">
            <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center gap-2 pointer-events-auto animate-fade-in-down">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{status.error}</span>
              <button onClick={() => setStatus(prev => ({...prev, error: null}))} className="ml-auto text-red-500 hover:text-red-700">×</button>
            </div>
          </div>
        )}

        {!resume ? (
          <div className="w-full flex items-center justify-center p-4 flex-col">
            <div className="w-full max-w-2xl mb-auto mt-auto">
              <div className="text-center mb-10">
                <h2 className={`text-3xl font-extrabold ${isGreyMode ? 'text-white' : 'text-gray-900'} mb-4 tracking-tight`}>Expert Resume Analysis</h2>
                <p className={`${isGreyMode ? 'text-gray-400' : 'text-gray-600'} text-lg max-w-lg mx-auto leading-relaxed`}>
                  Upload a PDF resume to instantly extract skills, run a strict ATS Diagnostic, and generate interview questions.
                </p>
              </div>
              <FileUploader 
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                isProcessing={status.isParsing}
                isGreyMode={isGreyMode}
              />
            </div>
            
            {/* Footer placed at the bottom of the intro screen */}
            <div className="mt-10 py-6 flex flex-col items-center justify-center gap-1 text-center">
              <div className={`flex items-center gap-1 text-xs ${isGreyMode ? 'text-gray-500' : 'text-gray-400'} font-medium tracking-wide`}>
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-current" />
                <span>by Techie Ayush Charde</span>
              </div>
              <p className={`text-[10px] ${isGreyMode ? 'text-gray-600' : 'text-gray-300'} uppercase tracking-widest mt-1`}>
                "Breaking things just to build them smarter"
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isGreyMode ? 'bg-transparent' : 'bg-white'} backdrop-blur-sm transition-colors relative z-10`}>
              <div className="flex-grow overflow-y-auto scrollbar-hide">
                <div className="flex flex-col pb-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} isGreyMode={isGreyMode} />
                  ))}
                  {status.isThinking && (
                     <div className={`flex w-full ${isGreyMode ? 'bg-slate-900/50' : 'bg-gray-50'} py-6 border-b ${isGreyMode ? 'border-slate-800' : 'border-gray-100'} animate-in fade-in duration-300`}>
                     <div className="w-full max-w-3xl mx-auto flex gap-4 px-4 sm:px-6">
                       <div className="flex-shrink-0">
                         <div className={`w-8 h-8 rounded-full ${isGreyMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}>
                           <div className={`w-2 h-2 ${isGreyMode ? 'bg-indigo-400' : 'bg-indigo-600'} rounded-full animate-bounce`}></div>
                         </div>
                       </div>
                       <div className="flex items-center">
                          <span className={`text-sm font-medium animate-pulse ${isGreyMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {messages[messages.length-1]?.text.includes("Deep") ? "Analyzing career trajectory and identifying gaps..." : "Generating insights..."}
                          </span>
                       </div>
                     </div>
                   </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className={`flex-shrink-0 border-t ${isGreyMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'} p-4 sm:p-6 transition-colors`}>
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className={`relative flex items-center shadow-sm rounded-xl border ${isGreyMode ? 'border-slate-700 bg-slate-800 focus-within:ring-indigo-500/50' : 'border-gray-300 bg-white focus-within:ring-indigo-500'} focus-within:ring-2 transition-all`}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about leadership experience, technical skills, or gaps..."
                      className={`flex-grow w-full py-3.5 pl-4 pr-12 bg-transparent border-none focus:ring-0 placeholder-gray-500 rounded-xl ${isGreyMode ? 'text-white' : 'text-gray-900'}`}
                      disabled={status.isThinking}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || status.isThinking}
                      className={`absolute right-2 p-2 ${isGreyMode ? 'text-indigo-400 hover:bg-slate-700' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                  {/* Chat Footer */}
                  <div className="flex flex-col items-center justify-center mt-3 gap-0.5">
                     <div className={`flex items-center gap-1 text-[10px] ${isGreyMode ? 'text-gray-600' : 'text-gray-300'} font-medium`}>
                        <span>Made with</span>
                        <Heart className="w-2.5 h-2.5 text-red-400 fill-current opacity-70" />
                        <span>by Techie Ayush Charde</span>
                      </div>
                      <p className={`text-[9px] ${isGreyMode ? 'text-gray-700' : 'text-gray-200'} uppercase tracking-widest`}>
                        "Breaking things just to build them smarter"
                      </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel (Responsive) */}
            <div 
              className={`
                fixed inset-y-0 right-0 z-10 w-80 ${isGreyMode ? 'bg-slate-900' : 'bg-gray-50'} border-l ${isGreyMode ? 'border-slate-800' : 'border-gray-200'} transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-96
                ${showPanel ? 'translate-x-0' : 'translate-x-full lg:hidden'}
              `}
              style={{ marginTop: '64px', height: 'calc(100% - 64px)' }}
            >
              <AnalysisPanel 
                analysis={analysis} 
                isLoading={status.isAnalyzing}
                isScanning={status.isScanningATS}
                onRunATS={handleATSCheck}
                onQuestionClick={(q) => handleSendMessage(q)}
                onDeepCritique={handleDeepCritique}
                isGreyMode={isGreyMode}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;