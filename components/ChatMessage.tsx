import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isGreyMode?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isGreyMode = false }) => {
  const isModel = message.role === 'model';
  
  // Dynamic classes based on theme
  const containerClass = isGreyMode 
    ? (isModel ? 'bg-white/90 backdrop-blur-sm' : 'bg-transparent')
    : (isModel ? 'bg-white' : 'bg-gray-50');

  const avatarClass = isGreyMode
    ? (isModel ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700')
    : (isModel ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600');

  const roleTextClass = isGreyMode ? 'text-gray-700' : 'text-gray-900';

  return (
    <div className={`flex w-full ${containerClass} py-8 border-b border-gray-100 transition-colors duration-200`}>
      <div className="w-full max-w-3xl mx-auto flex gap-6 px-4 sm:px-6">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${avatarClass}`}>
            {isModel ? <Bot size={20} /> : <User size={20} />}
          </div>
        </div>
        <div className="flex-grow pt-1 overflow-hidden">
          <div className={`font-bold text-sm ${roleTextClass} mb-2 tracking-wide uppercase`}>
            {isModel ? 'AI Analysis' : 'Recruiter'}
          </div>
          <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-gray-700 leading-7">
            <ReactMarkdown
              components={{
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-gray-900 font-bold mt-6 mb-2" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};