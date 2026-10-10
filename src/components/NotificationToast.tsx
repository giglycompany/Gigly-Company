import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';

interface NotificationToastProps {
  key?: React.Key;
  senderName: string;
  text: string;
  matchId: number;
  onOpen: () => void;
  onDismiss: () => void;
}

export function NotificationToast({
  senderName,
  text,
  onOpen,
  onDismiss,
}: NotificationToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] bg-[#FFFDF8] border-[3px] border-black rounded-[22px] p-3.5 shadow-[6px_7px_0px_0px_#000] select-none"
    >
      <div className="flex items-center gap-3">
        {/* Animated Icon Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-[#FFC629] border-[2px] border-black flex items-center justify-center font-display font-[800] text-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <MessageSquare className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full" />
        </div>

        {/* Message Content */}
        <div
          onClick={onOpen}
          className="flex-1 min-w-0 cursor-pointer group"
          title="Click to open chat"
        >
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 bg-black text-[#FFC629] rounded text-[9.5px] font-extrabold uppercase tracking-wide">
              New text
            </span>
            <h4 className="font-display font-[800] text-[13.5px] text-black truncate group-hover:underline">
              {senderName}
            </h4>
          </div>
          <p className="text-[12px] font-bold text-[#1A1A1A] truncate mt-0.5 leading-snug">
            "{text}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onOpen}
            className="px-2.5 py-1.5 bg-[#FFC629] hover:bg-[#FFD459] text-black font-display font-extrabold text-[11.5px] rounded-full border-[1.5px] border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-y-[1px]"
          >
            <span>Reply</span>
            <ArrowRight className="w-3 h-3 stroke-[3]" />
          </button>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 border-[1.5px] border-black flex items-center justify-center cursor-pointer text-black"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
