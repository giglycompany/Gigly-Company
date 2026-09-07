import { motion } from 'motion/react';
import { Briefcase, Building2, ArrowRight } from 'lucide-react';
import { GiglyLogo } from './GiglyLogo';

interface RoleSelectScreenProps {
  onSelectRole: (role: 'freelancer' | 'business') => void;
}

export function RoleSelectScreen({ onSelectRole }: RoleSelectScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="relative w-full max-w-[440px] min-h-[600px] h-[100dvh] flex flex-col justify-center p-6 bg-[#FFFCF5] select-none"
    >
      <div className="text-center mb-8">
        <div className="mb-2">
          <GiglyLogo size="md" />
        </div>
        <h2 className="font-display font-[800] text-[24px] text-black">
          How will you use Gigly?
        </h2>
        <p className="text-[13px] font-semibold text-[#6E6E6E] mt-1 max-w-[280px] mx-auto">
          This decides what you'll be swiping on.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Freelancer Option */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 2 }}
          onClick={() => onSelectRole('freelancer')}
          className="flex items-start gap-4 p-5 bg-white border-[3px] border-black rounded-[22px] shadow-[5px_6px_0px_0px_#000] text-left hover:shadow-[7px_8px_0px_0px_#000] transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-[2px_2px_0px_0px_#000]">
            <Briefcase className="w-7 h-7 text-black stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-[800] text-[17px] text-black">
                I'm a Freelancer
              </h3>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[12.5px] font-medium text-[#6E6E6E] mt-1 leading-snug">
              Swipe through gigs, make proposals, and match with clients hiring right now.
            </p>
          </div>
        </motion.button>

        {/* Business Owner Option */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 2 }}
          onClick={() => onSelectRole('business')}
          className="flex items-start gap-4 p-5 bg-white border-[3px] border-black rounded-[22px] shadow-[5px_6px_0px_0px_#000] text-left hover:shadow-[7px_8px_0px_0px_#000] transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-[2px_2px_0px_0px_#000]">
            <Building2 className="w-7 h-7 text-black stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-[800] text-[17px] text-black">
                I'm a Business Owner
              </h3>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[12.5px] font-medium text-[#6E6E6E] mt-1 leading-snug">
              Swipe through verified freelancer profiles and match with top talent to hire.
            </p>
          </div>
        </motion.button>
      </div>

      <div className="text-center mt-8">
        <p className="text-[11px] font-semibold text-[#8E8E8E]">
          You can switch modes or edit your profile at any time.
        </p>
      </div>
    </motion.div>
  );
}
