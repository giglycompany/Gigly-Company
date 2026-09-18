import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, ArrowRight, Star } from 'lucide-react';
import { GigItem } from '../types';

interface MatchOverlayProps {
  key?: React.Key;
  matchedJob: GigItem;
  isSuperLike?: boolean;
  onKeepSwiping: () => void;
  onGoToChat: () => void;
}

export function MatchOverlay({
  matchedJob,
  isSuperLike = false,
  onKeepSwiping,
  onGoToChat,
}: MatchOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(24 * 3600);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 bg-[#FFC629] z-50 flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="max-w-[380px] flex flex-col items-center"
      >
          {/* Animated Badge */}
          <div className="w-16 h-16 rounded-2xl bg-black border-[3px] border-black flex items-center justify-center mb-3 shadow-[4px_4px_0px_0px_#FFF] relative">
            {isSuperLike ? (
              <Star className="w-9 h-9 text-[#FFC629] fill-[#FFC629]" />
            ) : (
              <Sparkles className="w-9 h-9 text-[#FFC629] fill-[#FFC629]" />
            )}
          </div>

          {/* Superlike indicator pill */}
          {isSuperLike && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-black text-[#FFC629] px-3.5 py-1 rounded-full text-[11px] font-display font-[900] uppercase tracking-wider mb-2 border-[2px] border-black shadow-[2px_2px_0px_0px_#FFF]"
            >
              ★ Priority Super Match
            </motion.div>
          )}

          <h1 className="font-display font-[900] text-[44px] text-black leading-none tracking-tight mb-2">
            IT'S A MATCH
          </h1>

          <p className="text-[14px] font-bold text-black max-w-[280px] leading-snug mb-6">
            {isSuperLike ? (
              <>
                <span className="underline decoration-black">{matchedJob.client}</span> accepted your{' '}
                <span className="font-extrabold">Super Like</span> for{' '}
                <span className="font-extrabold">"{matchedJob.title}"</span>.
              </>
            ) : (
              <>
                <span className="underline decoration-black">{matchedJob.client}</span> liked your profile back for{' '}
                <span className="font-extrabold">"{matchedJob.title}"</span>.
              </>
            )}
          </p>

          {/* Pitch Window Text Display */}
          <div
            id="match-pitch-timer"
            className="flex flex-col items-center justify-center my-6 text-black select-none"
          >
            <span
              id="match-pitch-label"
              className="text-[12px] font-black uppercase tracking-[0.22em] text-black/75 flex items-center gap-1.5 mb-1"
            >
              <span className="w-2 h-2 rounded-full bg-black/80 animate-pulse inline-block" />
              Pitch Window Closes In
            </span>
            <span
              id="match-pitch-countdown"
              className="font-display font-[900] text-[34px] sm:text-[38px] text-black tracking-widest leading-none tabular-nums"
            >
              {hours}:{minutes}:{seconds}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onKeepSwiping}
              className="w-full py-3.5 px-6 bg-white text-black font-display font-[800] text-[14px] rounded-full border-[2.5px] border-black cursor-pointer shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              Keep swiping
            </button>
            <button
              onClick={onGoToChat}
              className="w-full py-3.5 px-6 bg-black text-[#FFC629] font-display font-[800] text-[14px] rounded-full border-[2.5px] border-black cursor-pointer shadow-[3px_3px_0px_0px_#FFF] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>Send proposal</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
}
