import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchRecord, GigItem } from '../types';
import {
  Sparkles,
  MessageCircle,
  Clock,
  Lock,
  X,
  Tag,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface MatchesScreenProps {
  matches: MatchRecord[];
  role: 'freelancer' | 'business';
  onOpenChat: (matchId: number) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatRemaining(expiresAt: number, now: number): string | null {
  const diff = expiresAt - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left to pitch`;
}

export function MatchesScreen({ matches, role, onOpenChat }: MatchesScreenProps) {
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [viewingProfile, setViewingProfile] = useState<{ job: GigItem; matchId: number } | null>(null);

  // Keep countdown timer synced
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter active vs expired
  const activePendingMatches = matches.filter(
    (m) => (!m.messages || m.messages.length === 0) && m.expiresAt > currentTime
  );
  const connectedMatches = matches.filter((m) => m.messages && m.messages.length > 0);
  const closedMatches = matches.filter(
    (m) => (!m.messages || m.messages.length === 0) && m.expiresAt <= currentTime
  );

  return (
    <div className="w-full flex flex-col relative">
      <header className="w-full mb-4">
        <div className="font-display font-[800] text-[26px] text-black tracking-tight flex items-center gap-1.5 mb-2">
          Gigly <span className="w-2.5 h-2.5 rounded-full bg-[#FFC629] border-[2px] border-black inline-block" />
        </div>
        <h2 className="font-display font-[800] text-[24px] text-black">Your matches</h2>
        <p className="text-[13px] font-semibold text-[#6E6E6E]">
          {matches.length === 0
            ? role === 'freelancer'
              ? 'Clients who swiped right back on you.'
              : 'Freelancers who swiped right back on you.'
            : activePendingMatches.length > 0
            ? `${activePendingMatches.length} pending ${
                activePendingMatches.length === 1 ? 'match' : 'matches'
              } ready for your pitch.`
            : connectedMatches.length > 0
            ? 'All active matches have been responded to and connected!'
            : 'No active pitch windows currently open.'}
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="bg-white border-[3px] border-dashed border-black rounded-[26px] p-8 text-center shadow-[4px_5px_0px_0px_#000] my-6">
          <div className="w-14 h-14 rounded-full bg-[#FFF9E6] border-2 border-black flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-[#FFC629] fill-[#FFC629]" />
          </div>
          <h3 className="font-display font-[800] text-[18px] text-black mb-1">
            No matches yet
          </h3>
          <p className="text-[13px] font-medium text-[#6E6E6E]">
            Swipe right on a few {role === 'freelancer' ? 'gigs' : 'freelancers'} in Explore to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => {
            const hasResponded = m.messages && m.messages.length > 0;
            const diff = m.expiresAt - currentTime;
            const isWindowClosed = !hasResponded && diff <= 0;
            const timer = formatRemaining(m.expiresAt, currentTime);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3.5 border-[2.5px] rounded-[20px] p-3.5 transition-all select-none ${
                  isWindowClosed
                    ? 'bg-[#F6F6F6] border-black/20 opacity-60 cursor-not-allowed shadow-none'
                    : 'bg-white border-black shadow-[4px_5px_0px_0px_#000]'
                }`}
              >
                {/* Avatar - clickable ONLY when pitch window is open / active */}
                <button
                  type="button"
                  disabled={isWindowClosed}
                  onClick={() => {
                    if (!isWindowClosed) {
                      setViewingProfile({ job: m.job, matchId: m.id });
                    }
                  }}
                  title={
                    isWindowClosed
                      ? 'Pitch window closed — profile is locked'
                      : 'View profile details'
                  }
                  className={`w-12 h-12 rounded-full border-[2.5px] flex items-center justify-center font-display font-[800] text-[14px] flex-shrink-0 transition-transform ${
                    isWindowClosed
                      ? 'bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed'
                      : 'bg-[#FFC629] border-black text-black shadow-[1px_1px_0px_0px_#000] cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                >
                  {isWindowClosed ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    getInitials(m.job.client)
                  )}
                </button>

                {/* Profile Info - clickable ONLY when pitch window is open / active */}
                <div
                  onClick={() => {
                    if (!isWindowClosed) {
                      setViewingProfile({ job: m.job, matchId: m.id });
                    }
                  }}
                  className={`flex-1 min-w-0 ${
                    isWindowClosed ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={
                    isWindowClosed
                      ? 'Pitch window closed — profile is locked'
                      : 'Click to view profile'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={`font-display font-bold text-[14px] truncate ${
                        isWindowClosed ? 'text-gray-500' : 'text-black'
                      }`}
                    >
                      {m.job.title}
                    </h4>
                  </div>

                  <div
                    className={`text-[11.5px] font-semibold truncate ${
                      isWindowClosed ? 'text-gray-400' : 'text-[#6E6E6E]'
                    }`}
                  >
                    {m.job.client} • {m.job.rate} {m.job.unit}
                  </div>

                  {/* Status Pills */}
                  {hasResponded ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1.5 rounded-full bg-[#E6F9EE] border-[1.5px] border-[#0D6832] text-[10px] font-extrabold text-[#0D6832]">
                      <span>✓ Connected ({m.messages.length} msg{m.messages.length > 1 ? 's' : ''})</span>
                    </div>
                  ) : !isWindowClosed && timer ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-full bg-[#FFC629] border-[1.5px] border-black text-[10px] font-extrabold text-black animate-pulse">
                      <Clock className="w-3 h-3 stroke-[2.5]" />
                      <span>{timer}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1.5 rounded-full bg-gray-200 border-[1.5px] border-gray-400 text-[10px] font-extrabold text-gray-500">
                      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Pitch window closed</span>
                    </div>
                  )}
                </div>

                {/* Action / Pitch Button */}
                {isWindowClosed ? (
                  <button
                    type="button"
                    disabled
                    title="Pitch window closed — 24-hour response period ended"
                    className="py-2 px-3.5 font-display font-bold text-[12px] rounded-full border border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed flex-shrink-0 flex items-center gap-1.5 opacity-80"
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Closed</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenChat(m.id)}
                    className={`py-2 px-3.5 font-display font-bold text-[12px] rounded-full border border-black cursor-pointer shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] flex-shrink-0 flex items-center gap-1.5 ${
                      hasResponded
                        ? 'bg-white text-black hover:bg-[#FFF9E6]'
                        : 'bg-black text-[#FFC629]'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{hasResponded ? 'Chat' : 'Pitch'}</span>
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Profile Detail Modal for Active Matches */}
      <AnimatePresence>
        {viewingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-md bg-white border-[3px] border-black rounded-t-[28px] sm:rounded-[28px] p-6 shadow-[6px_8px_0px_0px_#000] max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFC629] border-2 border-black flex items-center justify-center font-display font-[800] text-[16px] text-black shadow-[2px_2px_0px_0px_#000]">
                    {getInitials(viewingProfile.job.client)}
                  </div>
                  <div>
                    <h3 className="font-display font-[800] text-[17px] text-black">
                      {viewingProfile.job.client}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6E6E6E]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0D6832]" />
                      <span>Verified Match</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingProfile(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-black flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              {/* Rate & Category */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-[#FFF9E6] border-[1.5px] border-black rounded-full text-[12px] font-extrabold text-black">
                  {viewingProfile.job.rate} {viewingProfile.job.unit}
                </span>
                <span className="px-3 py-1 bg-black text-[#FFC629] border-[1.5px] border-black rounded-full text-[12px] font-extrabold">
                  {viewingProfile.job.category}
                </span>
              </div>

              {/* Project Title */}
              <div className="mb-4">
                <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1">
                  {role === 'business' ? 'Specialist Title' : 'Project Posting'}
                </span>
                <h4 className="font-display font-[800] text-[15px] text-black bg-[#FAF5E6] border border-black/20 p-3 rounded-xl">
                  {viewingProfile.job.title}
                </h4>
              </div>

              {/* About & Scope */}
              <div className="mb-4">
                <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1">
                  About & Scope
                </span>
                <p className="text-[13px] font-medium text-[#2C2C2C] leading-relaxed bg-white border-[1.5px] border-black/20 p-3 rounded-xl">
                  {viewingProfile.job.desc}
                </p>
              </div>

              {/* Skills & Tags */}
              {viewingProfile.job.tags && viewingProfile.job.tags.length > 0 && (
                <div className="mb-6">
                  <span className="text-[11px] font-extrabold uppercase text-[#6E6E6E] block mb-1.5">
                    {role === 'business' ? 'Skills & Tools' : 'Required Skills'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProfile.job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-white border-[1.5px] border-black rounded-lg text-[11px] font-bold text-black shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const matchId = viewingProfile.matchId;
                    setViewingProfile(null);
                    onOpenChat(matchId);
                  }}
                  className="flex-1 py-3 bg-[#FFC629] text-black font-display font-[800] text-[14px] rounded-full border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Start Pitch / Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingProfile(null)}
                  className="py-3 px-5 bg-white text-black font-display font-bold text-[13px] rounded-full border-[2px] border-black cursor-pointer hover:bg-gray-50 text-center"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
