import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Headphones, Sparkles, Compass, AlertCircle, HelpCircle, User, Bot, Loader2, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, Campus } from '../types';
import { brandLogo } from '../assets/logo';
import { CAMPUSES, CAKE_PRODUCTS, KIOSK_INVENTORY } from '../data';

interface SupportSectionProps {
  user: UserProfile;
  selectedCampus: Campus;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function SupportSection({ user, selectedCampus }: SupportSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello ${user.name || 'Campus Student'}! 👋 I am your Campus Cakes Assistant. Ask me anything about custom cake prep times, VIP XP loyalty tiers, or delivery logistics. How can I sweeten your day? 🎂`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: "🚚 Where do you deliver?", prompt: "Which residential student towers and locations on campus do you deliver to?" },
    { label: "📅 Custom cake preorder cut-off", prompt: "What are the rules and cut-off times for pre-ordering custom cakes?" },
    { label: "💳 Refund on damaged cakes", prompt: "What should I do if my cake arrives damaged during dorm delivery?" },
    { label: "🎒 How does VIP XP work?", prompt: "How do I earn VIP XP loyalty points and what reward perks are active?" },
  ];

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build history payload for server API
      const backendHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: backendHistory,
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            campusId: user.campusId,
            rewardPoints: user.rewardPoints,
            savedCelebrationsCount: user.savedCelebrations?.length || 0,
            walletBalance: user.walletBalance || 0
          },
          selectedCampus,
          campuses: CAMPUSES,
          cakeProducts: CAKE_PRODUCTS,
          kioskInventory: KIOSK_INVENTORY
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.text || "I apologize, but I could not compute a direct response. Please verify your query or reach our team directly at +91 99887 76655.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Support API failure:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: "🔌 Network glitch detected! Sorry, I had trouble reaching the bakery's motherboard. Please ensure your GEMINI_API_KEY is configured in Settings > Secrets. You can also reach our dormitory coordinate support line directly at +91 99887 76655.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div id="ai-support-section" className="space-y-8 max-w-4xl mx-auto">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto mb-4">
        <span className="text-[#E23744] font-extrabold uppercase tracking-widest text-[10px] bg-[#FCECEF] px-2.5 py-1 rounded-full dark:bg-rose-500/10">
          Smart Help Center
        </span>
        <h2 className="text-2xl md:text-3xl font-black font-display text-gray-950 dark:text-white tracking-tight mt-2.5">
          Campus Cakes Customer Support
        </h2>
        <p className="text-gray-400 dark:text-gray-400 text-xs mt-1.5 leading-relaxed font-semibold">
          Ask our instant coordinator to guide you on delivery cutoff guidelines, student VIP XP loyalty rewards, campus drop-off locations, & more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Support Guide Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#120709] border border-gray-150 dark:border-[#291316] rounded-2xl p-4 shadow-sm">
            <h4 className="font-extrabold text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Headphones className="w-3.5 h-3.5 text-[#E23744]" />
              Support Guidelines
            </h4>
            <div className="space-y-3.5">
              <div className="flex gap-2.5 items-start">
                <Compass className="w-4 h-4 text-[#C49A25] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-gray-800 dark:text-[#fafafa]">Dorm Delivery HQ</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-snug mt-0.5">Drop-offs are delivered directly to student host blocks, hostel lobbies, and student booths.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-gray-800 dark:text-[#fafafa]">Pre-order Cut-off Rules</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-snug mt-0.5">Any pre-ordered themed custom cake requires at least 24 hours of advance kitchen prep time.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-gray-800 dark:text-[#fafafa]">Quality Guarantee Policy</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-snug mt-0.5">If the delivery coord gets delayed or frosting is damaged, we grant full compensation. Dial +91 99887 76655.</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Live Chat Box */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#120709] border border-gray-150 dark:border-[#291316] rounded-2xl overflow-hidden shadow-sm h-[480px]">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#291316] bg-gray-50 dark:bg-[#1a0d0f]/50 flex justify-between items-center bg-radial">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="absolute bottom-0 right-0 z-10 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <div className="w-8 h-8 rounded-full border border-[#D4AF37]/30 bg-black overflow-hidden flex items-center justify-center p-[1px]">
                  <img src={brandLogo} className="w-full h-full object-cover rounded-full" alt="Campus Cakes Logo" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 dark:text-white leading-none flex items-center gap-1.5">
                  Bakery Coordinator
                </h4>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-none font-semibold">Ready to assist instantly</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-none">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isModel = msg.role === 'model';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div className={`h-7 w-7 flex items-center justify-center shrink-0 overflow-hidden ${isModel ? 'rounded-full border border-[#D4AF37]/25 bg-black p-[0.5px]' : 'p-1.5 rounded-xl border bg-red-50 dark:bg-red-500/10 text-[#E23744] border-red-100 dark:border-[#291316]'}`}>
                      {isModel ? (
                        <img src={brandLogo} className="w-full h-full object-cover rounded-full" alt="Bakery Coordinator" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed font-medium ${isModel ? 'bg-gray-50 dark:bg-[#1a0d0f]/50 text-gray-700 dark:text-gray-300' : 'bg-[#E23744] text-white'}`}>
                        {isModel ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="mb-0.5">{children}</li>,
                              strong: ({ children }) => <strong className="font-extrabold text-[#E23744] dark:text-rose-400">{children}</strong>,
                              table: ({ children }) => <div className="overflow-x-auto my-2 border border-gray-200 dark:border-zinc-800 rounded-lg"><table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-[10.5px]">{children}</table></div>,
                              th: ({ children }) => <th className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800/50 font-bold text-left">{children}</th>,
                              td: ({ children }) => <td className="px-3 py-1.5 border-t border-gray-100 dark:border-zinc-800/30">{children}</td>,
                              h3: ({ children }) => <h3 className="text-sm font-black text-gray-950 dark:text-white mt-3 mb-1">{children}</h3>,
                              h4: ({ children }) => <h4 className="text-xs font-black text-gray-950 dark:text-white mt-2 mb-1">{children}</h4>,
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          msg.text
                        )}
                      </div>
                      <p className={`text-[8px] text-gray-400 mt-1 uppercase ${isModel ? 'text-left' : 'text-right'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2.5 mr-auto"
                >
                  <div className="h-7 w-7 flex items-center justify-center shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/25 bg-black p-[0.5px]">
                    <img src={brandLogo} className="w-full h-full object-cover rounded-full animate-pulse" alt="Typing" />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#1a0d0f]/50 p-3 rounded-2xl text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin text-[#E23744]" />
                    <span>Active chef reasoning...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>



          {/* Input Area */}
          <div className="p-2.5 border-t border-gray-100 dark:border-[#291316]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about delivery options, student VIP XP program or custom orders..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 border border-gray-150 dark:border-[#291316] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-800 dark:text-white"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className={`p-2 bg-[#E23744] hover:bg-red-700 text-white rounded-xl transition-all shadow active:scale-95 flex items-center justify-center cursor-pointer ${isTyping || !inputText.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
