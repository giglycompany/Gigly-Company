import React from 'react';

interface GiglyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  dotClassName?: string;
  showDot?: boolean;
}

export function GiglyLogo({
  size = 'md',
  className = '',
  dotClassName = '',
  showDot = true,
}: GiglyLogoProps) {
  // Exact size scaling matching the brand image
  const textSizes = {
    sm: 'text-[22px]',
    md: 'text-[28px]',
    lg: 'text-[40px]',
    xl: 'text-[54px]',
    hero: 'text-[64px] sm:text-[80px]',
  };

  const dotSizes = {
    sm: 'w-2.5 h-2.5 border-[1.5px] mt-1.5',
    md: 'w-3 h-3 border-[2px] mt-2',
    lg: 'w-4 h-4 border-[2.5px] mt-3',
    xl: 'w-5 h-5 border-[3px] mt-3.5',
    hero: 'w-5 h-5 sm:w-6 sm:h-6 border-[2.5px] sm:border-[3.5px] mt-4 sm:mt-5',
  };

  return (
    <div className={`inline-flex items-center gap-1 select-none ${className}`}>
      <span
        className={`font-black text-black leading-none ${textSizes[size]}`}
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          fontWeight: 900,
          letterSpacing: '-0.04em',
        }}
      >
        Gigly
      </span>
      {showDot && (
        <span
          className={`rounded-full bg-[#FFC629] border-black flex-shrink-0 inline-block shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] ${dotSizes[size]} ${dotClassName}`}
        />
      )}
    </div>
  );
}
