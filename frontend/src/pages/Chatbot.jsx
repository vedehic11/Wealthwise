import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../utils';
import { useUserData } from '../context/UserDataContext';
import PageHeader from '../components/PageHeader';

const defaultPrompts = [
  "What is the stock price of Adani Green?",
  "Give me analysis for Tata Consultancy Services",
  "What is the stock analysis for Reliance Industries?",
  "How is my portfolio performing?",
  "What should I invest in next?"
];

const Chatbot = () => {
  const { userData, getPortfolioSummary, getAssetAllocation } = useUserData();
  const messagesEndRef = useRef(null);
  const cleanAssistantHtml = (html) => {
    try {
      if (typeof html !== 'string') return '';
      let out = html
        .replace(/\s{2,}/g, ' ') // collapse long spaces
        .replace(/(<br\s*\/?\s*>\s*){3,}/gi, '<br><br>') // limit consecutive br
        .replace(/<p>\s*<\/p>/gi, '') // remove empty paragraphs
        .replace(/(<p>\s*){2,}/gi, '<p>')
        .replace(/(\s*<\/p>){2,}/gi, '</p>')
        .trim();
      return out;
    } catch {
      return html;
    }
  };
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hello! I\'m your AI financial assistant. I have access to your complete financial profile and can provide personalized advice. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Add simple typing indicator
    setMessages(prev => [...prev, {
      type: 'bot',
      content: 'Thinking...',
      timestamp: new Date(),
      isTyping: true
    }]);

    try {
      // Prepare user financial data for the AI agent
      const portfolioSummary = getPortfolioSummary();
      const assetAllocation = getAssetAllocation();
      
      const financialContext = {
        assets: userData.assets,
        liabilities: userData.liabilities,
        incomes: userData.incomes,
        expenses: userData.expenses,
        goals: userData.goals,
        riskTolerance: userData.riskTolerance,
        portfolioSummary: portfolioSummary,
        assetAllocation: assetAllocation
      };

      const response = await axios.post(`${SERVER_URL}/agent`, {
        user_input: input,
        financial_data: financialContext
      });

      setIsTyping(false);
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.isTyping) {
          return [
            ...prev.slice(0, -1),
            {
              type: 'bot',
              content: response.data && response.data.response
                ? cleanAssistantHtml(response.data.response)
                : 'Sorry, I could not generate a response.',
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.isTyping) {
          return [
            ...prev.slice(0, -1),
            {
              type: 'bot',
              content: "Sorry, I encountered an error. Please try again.",
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6">
      <PageHeader 
        title="AI Financial Assistant"
        subtitle="Get intelligent insights and advice about your investments and financial goals"
        icon={MessageSquare}
        className="mb-4"
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-[calc(100%-8rem)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-2 rounded-lg ${message.type === 'user' ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className={`relative p-4 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <div className="text-sm whitespace-pre-line">
                    {message.isTyping ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-pulse">💭</div>
                        <span className="text-gray-600 dark:text-gray-400">{message.content}</span>
                      </div>
                    ) : message.type === 'bot' && /<\w+/.test(message.content) ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content }} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {/* Default Prompts */}
          <div className="mb-4 flex flex-wrap gap-2">
            {defaultPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
