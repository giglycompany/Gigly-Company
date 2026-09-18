import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Sparkles, Zap } from 'lucide-react';
import { GigItem } from '../types';

interface SuperlikeAnimationProps {
  item: GigItem | null;
  isVisible: boolean;
}

export function SuperlikeAnimation({ item, isVisible }: SuperlikeAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && item && (
        <motion.div
          key="superlike-burst"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-black/50 backdrop-blur-[2px]"
        >
          {/* Radiating Background Rings */}
          <motion.div
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="absolute w-[240px] h-[240px] rounded-full border-[5px] border-[#FFC629]"
          />
          <motion.div
            initial={{ scale: 0.1, opacity: 0.9 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
            className="absolute w-[200px] h-[200px] rounded-full border-[3px] border-white"
          />

          {/* Star Particles */}
          {[-70, -35, 35, 70, -100, 100].map((offsetX, i) => {
            const offsetY = (i % 2 === 0 ? -1 : 1) * (50 + (i * 12) % 60);
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.3, 0.7],
                  x: offsetX * 1.3,
                  y: offsetY * 1.3,
                  opacity: [1, 1, 0],
                  rotate: i * 50,
                }}
                transition={{ duration: 0.75, delay: i * 0.04, ease: 'easeOut' }}
                className="absolute text-[#FFC629]"
              >
                <Star className="w-6 h-6 fill-[#FFC629] text-black stroke-[1.5]" />
              </motion.div>
            );
          })}

          {/* Central Star Burst Container */}
          <motion.div
            initial={{ scale: 0.4, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="relative flex flex-col items-center select-none"
          >
            {/* Accent Star Badge */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFC629] border-[3.5px] border-black flex items-center justify-center shadow-[5px_5px_0px_0px_#000]">
                <Star className="w-11 h-11 sm:w-13 sm:h-13 text-black fill-black" />
              </div>

              <div className="absolute -top-1.5 -right-1.5 bg-white text-black p-1 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
                <Zap className="w-3.5 h-3.5 fill-[#FFC629] text-black" />
              </div>
            </div>

            {/* SUPER LIKE Title Pill */}
            <div className="mt-4 bg-[#FFC629] text-black px-5 py-1.5 rounded-2xl border-[3px] border-black shadow-[3px_4px_0px_0px_#000] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black fill-black" />
              <span className="font-display font-[900] text-[20px] sm:text-[22px] tracking-wider uppercase">
                SUPER LIKE!
              </span>
            </div>

            {/* Subtitle / Target info */}
            <div className="mt-2.5 bg-white text-black px-3.5 py-1 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] text-[11px] font-extrabold max-w-[260px] truncate">
              Priority Proposal → {item.title}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
