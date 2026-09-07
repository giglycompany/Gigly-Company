import React from 'react';
import { motion } from 'motion/react';
import { MatchRecord } from '../types';
import { Sparkles, MessageCircle, Clock } from 'lucide-react';

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

function formatRemaining(expiresAt: number): string | null {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left to pitch`;
}

export function MatchesScreen({ matches, role, onOpenChat }: MatchesScreenProps) {
  // Pending matches that haven't been responded to yet
  const pendingMatches = matches.filter((m) => !m.messages || m.messages.length === 0);
  const connectedMatches = matches.filter((m) => m.messages && m.messages.length > 0);

  return (
    <div className="w-full flex flex-col">
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
            : pendingMatches.length > 0
            ? `${pendingMatches.length} pending ${
                pendingMatches.length === 1 ? 'match' : 'matches'
              } awaiting your first response.`
            : 'All matches have been responded to and connected!'}
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
            const timer = formatRemaining(m.expiresAt);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3.5 bg-white border-[2.5px] border-black rounded-[20px] p-3.5 shadow-[4px_5px_0px_0px_#000]"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center font-display font-[800] text-[14px] text-black flex-shrink-0 shadow-[1px_1px_0px_0px_#000]">
                  {getInitials(m.job.client)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-[14px] text-black truncate">
                    {m.job.title}
                  </h4>
                  <div className="text-[11.5px] font-semibold text-[#6E6E6E] truncate">
                    {m.job.client} • {m.job.rate} {m.job.unit}
                  </div>

                  {hasResponded ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1.5 rounded-full bg-[#E6F9EE] border-[1.5px] border-[#0D6832] text-[10px] font-extrabold text-[#0D6832]">
                      <span>✓ Connected ({m.messages.length} msg{m.messages.length > 1 ? 's' : ''})</span>
                    </div>
                  ) : timer ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-full bg-[#FFC629] border-[1.5px] border-black text-[10px] font-extrabold text-black animate-pulse">
                      <Clock className="w-3 h-3 stroke-[2.5]" />
                      <span>{timer}</span>
                    </div>
                  ) : (
                    <div className="inline-block px-2 py-0.5 mt-1.5 rounded-full bg-gray-100 border-[1.5px] border-gray-300 text-[10px] font-bold text-gray-500">
                      Window closed
                    </div>
                  )}
                </div>

                {/* Message Button */}
                <button
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
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
