import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { GigItem } from '../types';

interface MatchOverlayProps {
  matchedJob: GigItem | null;
  onKeepSwiping: () => void;
  onGoToChat: () => void;
}

export function MatchOverlay({ matchedJob, onKeepSwiping, onGoToChat }: MatchOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(24 * 3600);

  useEffect(() => {
    if (!matchedJob) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [matchedJob]);

  if (!matchedJob) return null;

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#FFC629] z-50 flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="max-w-[380px] flex flex-col items-center"
        >
          {/* Animated Badge */}
          <div className="w-16 h-16 rounded-2xl bg-black border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_#FFF]">
            <Sparkles className="w-9 h-9 text-[#FFC629] fill-[#FFC629]" />
          </div>

          <h1 className="font-display font-[900] text-[44px] text-black leading-none tracking-tight mb-2">
            IT'S A MATCH
          </h1>

          <p className="text-[14px] font-bold text-black max-w-[280px] leading-snug mb-6">
            <span className="underline decoration-black">{matchedJob.client}</span> liked your profile back for{' '}
            <span className="font-extrabold">"{matchedJob.title}"</span>.
          </p>

          {/* Countdown Pill */}
          <div className="bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-3 border-[2px] border-black shadow-[3px_4px_0px_0px_#FFF] mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC629]">
              Pitch Window
            </span>
            <span className="font-display font-extrabold text-[16px] text-white tracking-widest min-w-[70px]">
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
    </AnimatePresence>
  );
}
