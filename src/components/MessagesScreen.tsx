import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchRecord, GigItem } from '../types';
import {
  ArrowLeft,
  Send,
  Sparkles,
  CheckCheck,
  ShieldCheck,
  Star,
  Tag,
  Briefcase,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import {
  FREELANCER_SUGGESTIONS,
  BUSINESS_SUGGESTIONS,
  CLIENT_REPLIES,
  FREELANCER_REPLIES,
} from '../data/mockData';

interface MessagesScreenProps {
  matches: MatchRecord[];
  role: 'freelancer' | 'business';
  activeChatId: number | null;
  onSelectChat: (id: number | null) => void;
  onSendMessage: (matchId: number, text: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MessagesScreen({
  matches,
  role,
  activeChatId,
  onSelectChat,
  onSendMessage,
}: MessagesScreenProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<GigItem | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeMatch = matches.find((m) => m.id === activeChatId);

  // Suggestions tailored to whether the user is a freelancer or a business owner
  const suggestions = role === 'business' ? BUSINESS_SUGGESTIONS : FREELANCER_SUGGESTIONS;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMatch?.messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeMatch) return;

    onSendMessage(activeMatch.id, text);
    setInputText('');

    // Simulate typing and reply from the opposite role (Freelancer reply vs Business Client reply)
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyPool = role === 'business' ? FREELANCER_REPLIES : CLIENT_REPLIES;
      const reply = replyPool[Math.floor(Math.random() * replyPool.length)];
      onSendMessage(activeMatch.id, `__THEM__:${reply}`);
    }, 1200);
  };

  // 1. Detailed Chat View
  if (activeMatch) {
    return (
      <div className="w-full h-[calc(100dvh-130px)] min-h-[460px] flex flex-col justify-between relative">
        {/* Header - Clickable to view profile */}
        <div className="flex items-center gap-2.5 pb-3 border-b-2 border-dashed border-black/15">
          <button
            onClick={() => onSelectChat(null)}
            className="w-9 h-9 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:translate-y-[-1px] active:translate-y-[1px]"
            title="Back to conversations"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>

          {/* Clickable user profile trigger */}
          <button
            id="chat-profile-trigger"
            onClick={() => setViewingProfile(activeMatch.job)}
            className="flex-1 flex items-center gap-2.5 min-w-0 p-1.5 rounded-2xl hover:bg-[#FFF9E6] transition-colors border-2 border-transparent hover:border-black text-left group cursor-pointer"
            title="Click to view full profile"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFC629] border-2 border-black flex items-center justify-center font-display font-[800] text-[13px] text-black shadow-[1.5px_1.5px_0px_0px_#000] flex-shrink-0 group-hover:scale-105 transition-transform">
              {getInitials(activeMatch.job.client)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-[14.5px] text-black truncate group-hover:underline">
                  {activeMatch.job.client}
                </h4>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-black text-[#FFC629] rounded flex items-center gap-0.5">
                  <span>Profile</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#6E6E6E] truncate">
                {activeMatch.job.title}
              </p>
            </div>
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 custom-scrollbar-y py-3 space-y-2.5 pr-1.5">
          {activeMatch.messages.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white border-[2px] border-black text-center shadow-[3px_3px_0px_0px_#000] my-4">
              <Sparkles className="w-6 h-6 text-[#FFC629] fill-[#FFC629] mx-auto mb-1.5" />
              <p className="text-[12.5px] font-bold text-black">
                You matched with {activeMatch.job.client}!
              </p>
              <p className="text-[11.5px] text-[#6E6E6E] mt-0.5">
                {role === 'business'
                  ? 'Reach out to discuss your project scope or tap a suggested message below.'
                  : 'Send your proposal or tap one of the suggested icebreakers below.'}
              </p>
            </div>
          ) : (
            activeMatch.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.from === 'me' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-[18px] text-[13.5px] font-medium leading-snug border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                    msg.from === 'me'
                      ? 'bg-[#FFC629] text-black rounded-br-none'
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9.5px] font-semibold text-[#8E8E8E] mt-0.5 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-2 rounded-2xl w-fit shadow-[2px_2px_0px_0px_#000]">
              <span className="w-2 h-2 rounded-full bg-black animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Role-Specific Suggested Chips */}
        {activeMatch.messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSend(sug)}
                className="px-3 py-1.5 bg-white border-[1.5px] border-black rounded-full text-[11.5px] font-bold text-black shadow-[1.5px_2px_0px_0px_#000] hover:bg-[#FFC629] active:translate-y-[1px] transition-colors cursor-pointer text-left"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              role === 'business'
                ? 'Type message, project inquiry, or invite...'
                : 'Type a message or proposal...'
            }
            className="flex-1 px-4 py-2.5 bg-white border-[2.5px] border-black rounded-full text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-full bg-black text-[#FFC629] border-[2px] border-black flex items-center justify-center cursor-pointer shadow-[2px_3px_0px_0px_#000] disabled:opacity-40 hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* POPUP MODAL: CONTACT PROFILE */}
        <AnimatePresence>
          {viewingProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setViewingProfile(null)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#FFFDF9] border-[3.5px] border-black rounded-[28px] p-6 shadow-[8px_10px_0px_0px_#000] relative max-h-[85vh] custom-scrollbar-y"
              >
                {/* Close button */}
                <button
                  onClick={() => setViewingProfile(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFC629] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-black stroke-[3]" />
                </button>

                {/* Profile Header */}
                <div className="flex items-center gap-3.5 mb-4 pr-8">
                  <div className="w-14 h-14 rounded-full bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center font-display font-[800] text-[20px] text-black shadow-[2px_2px_0px_0px_#000] flex-shrink-0">
                    {getInitials(viewingProfile.client)}
                  </div>
                  <div>
                    <h3 className="font-display font-[800] text-[19px] text-black leading-tight">
                      {viewingProfile.client}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0C2] border-[1.5px] border-black text-[11px] font-extrabold text-black">
                        {viewingProfile.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#1A1A1A]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rate & Status Banner */}
                <div className="bg-white border-[2px] border-black rounded-2xl p-3.5 mb-4 shadow-[3px_3px_0px_0px_#000] flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-extrabold uppercase text-[#777] block">
                      {role === 'business' ? 'Hourly / Project Rate' : 'Estimated Budget'}
                    </span>
                    <span className="font-display font-[800] text-[20px] text-black">
                      {viewingProfile.rate}
                      <span className="text-[12px] font-bold text-[#555] ml-1">
                        {viewingProfile.unit}
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] font-extrabold uppercase text-[#777] block">
                      Activity / Track Record
                    </span>
                    <span className="text-[12.5px] font-bold text-black">
                      {viewingProfile.proposals || 'Active in network'}
                    </span>
                  </div>
                </div>

                {/* Role / Job Title */}
                <div className="mb-3.5">
                  <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1">
                    {role === 'business' ? 'Specialist Title' : 'Project Posting'}
                  </span>
                  <h4 className="font-display font-[800] text-[15px] text-black bg-[#FAF5E6] border border-black/20 p-2.5 rounded-xl">
                    {viewingProfile.title}
                  </h4>
                </div>

                {/* About / Description */}
                <div className="mb-4">
                  <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1">
                    About & Scope
                  </span>
                  <p className="text-[13px] font-medium text-[#2C2C2C] leading-relaxed bg-white border-[1.5px] border-black/20 p-3 rounded-xl">
                    {viewingProfile.desc}
                  </p>
                </div>

                {/* Tags / Skills */}
                {viewingProfile.tags && viewingProfile.tags.length > 0 && (
                  <div className="mb-5">
                    <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1.5">
                      {role === 'business' ? 'Skills & Tools' : 'Required Skills'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProfile.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black rounded-lg text-[11px] font-bold text-black shadow-[1.5px_1.5px_0px_0px_#000]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => setViewingProfile(null)}
                  className="w-full py-3 bg-[#FFC629] text-black font-display font-[800] text-[14px] rounded-full border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>Continue Chatting</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 2. Chat Overview List
  return (
    <div className="w-full flex flex-col">
      <header className="w-full mb-4">
        <div className="font-display font-[800] text-[26px] text-black tracking-tight flex items-center gap-1.5 mb-2">
          Gigly <span className="w-2.5 h-2.5 rounded-full bg-[#FFC629] border-[2px] border-black inline-block" />
        </div>
        <h2 className="font-display font-[800] text-[24px] text-black">Messages</h2>
        <p className="text-[13px] font-semibold text-[#6E6E6E]">
          {role === 'freelancer'
            ? "Chat with clients you've matched with."
            : "Chat with freelancers you've matched with."}
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="bg-white border-[3px] border-dashed border-black rounded-[26px] p-8 text-center shadow-[4px_5px_0px_0px_#000] my-6">
          <div className="w-14 h-14 rounded-full bg-[#FFF9E6] border-2 border-black flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-[#FFC629] fill-[#FFC629]" />
          </div>
          <h3 className="font-display font-[800] text-[18px] text-black mb-1">
            No conversations yet
          </h3>
          <p className="text-[13px] font-medium text-[#6E6E6E]">
            Match with a {role === 'freelancer' ? 'gig' : 'talent'} in Explore to start chatting.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => {
            const lastMessage = m.messages[m.messages.length - 1];
            const preview = lastMessage
              ? `${lastMessage.from === 'me' ? 'You: ' : ''}${lastMessage.text}`
              : `Say hi to ${m.job.client} 👋`;

            return (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectChat(m.id)}
                className="flex items-center gap-3.5 bg-white border-[2.5px] border-black rounded-[20px] p-3.5 shadow-[4px_5px_0px_0px_#000] text-left cursor-pointer hover:shadow-[5px_6px_0px_0px_#000] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center font-display font-[800] text-[14px] text-black flex-shrink-0">
                  {getInitials(m.job.client)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-[14.5px] text-black truncate">
                      {m.job.client}
                    </h4>
                    {m.messages.length === 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFC629] border-[1.5px] border-black" />
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-[#6E6E6E] truncate mt-0.5">
                    {preview}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

