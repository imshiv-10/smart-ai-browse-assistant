import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, PageContent } from '@/shared/types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  pageContent: PageContent | null;
}

export function ChatWindow({
  messages,
  isLoading,
  onSendMessage,
  pageContent,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    { text: 'Summarize this', icon: '📝' },
    { text: 'Key points?', icon: '💡' },
    { text: 'Explain simply', icon: '🎯' },
    { text: 'What\'s important?', icon: '⭐' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {/* AI Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-2">
              How can I help?
            </h3>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 max-w-[280px]">
              Ask me anything about this page. I'll use the content to give you relevant answers.
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
              {suggestedQuestions.map((question) => (
                <button
                  key={question.text}
                  onClick={() => onSendMessage(question.text)}
                  disabled={!pageContent}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">{question.icon}</span>
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {question.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex animate-slide-in ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Assistant avatar */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-4 py-3 ${
                    message.role === 'user'
                      ? 'message-user'
                      : 'message-assistant'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      message.role === 'user'
                        ? 'text-white/60'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start animate-slide-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="message-assistant px-5 py-4">
                  <div className="flex gap-1.5">
                    <div className="loading-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                    <div className="loading-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                    <div className="loading-dot w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - iMessage style */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pageContent ? 'Message' : 'Loading page...'}
              disabled={!pageContent || isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-2xl border-0 bg-gray-100 dark:bg-gray-800 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !pageContent}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </form>

        {/* Powered by indicator */}
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
          Powered by AI
        </p>
      </div>
    </div>
  );
}
