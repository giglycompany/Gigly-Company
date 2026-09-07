import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, ArrowRight } from 'lucide-react';

interface StartupAnimationProps {
  onStart: () => void;
}

export function StartupAnimation({ onStart }: StartupAnimationProps) {
  const [animKey, setAnimKey] = useState(0);
  const [stage, setStage] = useState<
    'initial-square' | 'grid-3x3' | 'merge-left' | 'wipe-text' | 'final-lockup' | 'cta-ready'
  >('initial-square');

  // Exact timeline choreography matching the kinetic animation:
  // 0.0s - 0.7s: Camera zoom-out begins + initial center block pops
  // 0.7s - 1.8s: 3x3 matrix grid expands
  // 1.8s - 2.8s: Merge into unified block and shifts left
  // 2.8s - 3.8s: Wipes to reveal "Gigly" wordmark
  // 3.8s - 4.6s: Block morphs into the signature Gigly yellow dot
  // 4.6s+: Tagline, #FCFCF9 badge, and "Get Started" CTA settle in
  useEffect(() => {
    setStage('initial-square');

    const t1 = setTimeout(() => setStage('grid-3x3'), 700);
    const t2 = setTimeout(() => setStage('merge-left'), 1800);
    const t3 = setTimeout(() => setStage('wipe-text'), 2800);
    const t4 = setTimeout(() => setStage('final-lockup'), 3800);
    const t5 = setTimeout(() => setStage('cta-ready'), 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [animKey]);

  return (
    <div
      id="screen-startup"
      key={animKey}
      className="relative w-full h-[100dvh] min-h-screen flex flex-col items-center justify-center bg-[#ECE8DF] overflow-hidden select-none p-0"
    >
      {/* Top Controls: Replay & Skip */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setAnimKey((k) => k + 1)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-[12px] font-semibold border border-black/20 transition-all cursor-pointer backdrop-blur-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
          title="Replay Animation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay</span>
        </button>

        {stage !== 'cta-ready' && (
          <button
            onClick={() => setStage('cta-ready')}
            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black text-white/90 hover:text-white text-[12px] font-semibold border border-black/15 transition-all cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95"
          >
            Skip
          </button>
        )}
      </div>

      {/* 
        Full-screen canvas spanning 100% width and height on both mobile and desktop
      */}
      <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#ECE8DF] flex items-center justify-center">
        
        {/* ========================================================================= */}
        {/* BACKGROUND TAPESTRY WITH ZOOM-OUT CAMERA & CONTINUOUS LIVE DOODLES       */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ scale: 2.2, x: '25%', y: '20%' }}
          animate={{ scale: 1, x: '0%', y: '0%' }}
          transition={{
            duration: 1.6,
            ease: [0.22, 1, 0.36, 1], // Smooth cinematic camera pull back
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Subtle paper tone background matching video #ECE8DF */}
          <div className="absolute inset-0 bg-[#ECE8DF]" />

          {/* Scoped CSS Keyframe Animations for continuous live background motion */}
          <style>{`
            @keyframes steamRise1 {
              0% { transform: translateY(0px) scaleY(0.9); opacity: 0.2; }
              50% { transform: translateY(-7px) scaleY(1.15) skewX(2deg); opacity: 0.9; }
              100% { transform: translateY(-14px) scaleY(1.3) skewX(-2deg); opacity: 0; }
            }
            @keyframes steamRise2 {
              0% { transform: translateY(0px) scaleY(0.9); opacity: 0.3; }
              50% { transform: translateY(-8px) scaleY(1.1) skewX(-3deg); opacity: 0.85; }
              100% { transform: translateY(-16px) scaleY(1.25) skewX(2deg); opacity: 0; }
            }
            @keyframes steamRise3 {
              0% { transform: translateY(0px) scaleY(0.85); opacity: 0.2; }
              50% { transform: translateY(-6px) scaleY(1.2) skewX(3deg); opacity: 0.95; }
              100% { transform: translateY(-13px) scaleY(1.3) skewX(-1deg); opacity: 0; }
            }
            @keyframes pencilCheck {
              0% { transform: translate(36px, 108px) rotate(32deg); }
              25% { transform: translate(52px, 108px) rotate(30deg); }
              50% { transform: translate(70px, 108px) rotate(34deg); }
              70% { transform: translate(84px, 108px) rotate(32deg); }
              80% { transform: translate(88px, 102px) rotate(26deg); }
              90% { transform: translate(42px, 104px) rotate(28deg); }
              100% { transform: translate(36px, 108px) rotate(32deg); }
            }
            @keyframes magnifierSearch {
              0% { transform: translate(500px, 40px) rotate(-18deg) scale(0.95); }
              20% { transform: translate(520px, 28px) rotate(-8deg) scale(1.02); }
              40% { transform: translate(540px, 50px) rotate(-28deg) scale(1.05); }
              60% { transform: translate(490px, 60px) rotate(-12deg) scale(0.98); }
              80% { transform: translate(470px, 35px) rotate(-22deg) scale(1.03); }
              100% { transform: translate(500px, 40px) rotate(-18deg) scale(0.95); }
            }
            @keyframes magnifierSearchMobile {
              0% { transform: translate(250px, 120px) rotate(-18deg) scale(1); }
              20% { transform: translate(270px, 105px) rotate(-8deg) scale(1.08); }
              40% { transform: translate(285px, 135px) rotate(-28deg) scale(1.12); }
              60% { transform: translate(235px, 145px) rotate(-12deg) scale(1.05); }
              80% { transform: translate(220px, 110px) rotate(-22deg) scale(1.1); }
              100% { transform: translate(250px, 120px) rotate(-18deg) scale(1); }
            }
            @keyframes searchPulseRadar {
              0% { transform: scale(0.4); opacity: 0.9; }
              50% { transform: scale(1.2); opacity: 0.4; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            @keyframes cameraTallyFlicker {
              0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px #FF2E2E); }
              45% { opacity: 1; filter: drop-shadow(0 0 5px #FF2E2E); }
              50% { opacity: 0.15; filter: none; }
              65% { opacity: 0.15; filter: none; }
              70% { opacity: 1; filter: drop-shadow(0 0 4px #FF2E2E); }
            }
            @keyframes cameraLensFlash {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.12); }
            }
            @keyframes filmReelSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes gearSpinCw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes gearSpinCcw {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            @keyframes starTwinkle {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.35) rotate(15deg); opacity: 1; }
            }
            @keyframes screenCursorBlink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            @keyframes checkmarkPulse {
              0%, 100% { stroke-width: 4; stroke: #1A1A1A; }
              50% { stroke-width: 5; stroke: #000000; }
            }

            /* Orientation responsive helper: landscape/wide view vs portrait/vertical view */
            .tapestry-landscape {
              display: none;
            }
            .tapestry-portrait {
              display: block;
            }
            @media (min-aspect-ratio: 1.25/1) {
              .tapestry-landscape {
                display: block;
              }
              .tapestry-portrait {
                display: none;
              }
            }
          `}</style>

          {/* DESKTOP / WIDE SCREEN LANDSCAPE SVG DOODLES */}
          <svg
            viewBox="0 0 1000 562"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="tapestry-landscape w-full h-full absolute inset-0"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* 1. BRIEFCASE (Top Left) */}
            <g transform="translate(160, 65) scale(0.85) rotate(-6)">
              <path
                d="M48 24V14C48 9.58 51.58 6 56 6H80C84.42 6 88 9.58 88 14V24"
                stroke="#1A1A1A"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <rect
                x="8"
                y="24"
                width="120"
                height="82"
                rx="16"
                fill="#E8E4DA"
                stroke="#1A1A1A"
                strokeWidth="4.5"
              />
              <path
                d="M8 48C36 58 100 58 128 48"
                stroke="#1A1A1A"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect x="34" y="40" width="13" height="20" rx="3" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3.5" />
              <rect x="88" y="40" width="13" height="20" rx="3" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3.5" />
              <circle cx="68" cy="56" r="3.5" fill="#1A1A1A" />
              <line x1="20" y1="92" x2="116" y2="92" stroke="#1A1A1A" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.4" />
            </g>

            {/* 2. COFFEE CUP WITH CONTINUOUS STEAM ANIMATION (Top Center-Left) */}
            <g transform="translate(340, 25) scale(0.88)">
              <path
                d="M25 18C23 10 28 6 25 1"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  animation: 'steamRise1 2.2s ease-in-out infinite',
                  transformOrigin: '25px 18px',
                }}
              />
              <path
                d="M38 19C36 11 41 7 38 2"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  animation: 'steamRise2 2.6s ease-in-out 0.4s infinite',
                  transformOrigin: '38px 19px',
                }}
              />
              <path
                d="M51 18C49 10 54 6 51 1"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  animation: 'steamRise3 2.4s ease-in-out 0.8s infinite',
                  transformOrigin: '51px 18px',
                }}
              />
              <path
                d="M16 28H60V50C60 62.15 50.15 72 38 72C25.85 72 16 62.15 16 50V28Z"
                fill="#E8E4DA"
                stroke="#1A1A1A"
                strokeWidth="4.5"
              />
              <path
                d="M60 36C68 36 74 40 74 48C74 56 68 60 60 60"
                stroke="#1A1A1A"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <path d="M8 77H68" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
            </g>

            {/* 3. CONTINUOUS SEARCHING MAGNIFYING GLASS (Top Center-Right) */}
            <g
              style={{
                animation: 'magnifierSearch 6s ease-in-out infinite',
                transformOrigin: '30px 30px',
              }}
            >
              {/* Pulsing Search Radar Waves inside the lens */}
              <circle
                cx="30"
                cy="30"
                r="16"
                stroke="#FFC629"
                strokeWidth="2.5"
                fill="none"
                style={{
                  transformOrigin: '30px 30px',
                  animation: 'searchPulseRadar 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                }}
              />
              {/* Glass Lens with Light Blue/Yellow Tint */}
              <circle cx="30" cy="30" r="24" fill="#F4EFE6" stroke="#1A1A1A" strokeWidth="4.5" />
              {/* Target / Focus Crosshair in lens */}
              <line x1="30" y1="20" x2="30" y2="40" stroke="#FFC629" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <line x1="20" y1="30" x2="40" y2="30" stroke="#FFC629" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <circle cx="30" cy="30" r="3" fill="#1A1A1A" />
              {/* Glare Line with subtle reflection pulse */}
              <path
                d="M20 18C25 15 35 15 40 18"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  animation: 'cameraLensFlash 3.5s ease-in-out infinite',
                }}
              />
              {/* Handle */}
              <line x1="48" y1="48" x2="75" y2="75" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
              <line x1="56" y1="56" x2="72" y2="72" stroke="#FFC629" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 4. VIDEO CAMERA WITH FLICKERING TALLY LIGHT & REELS (Top Right) */}
            <g transform="translate(685, 35) scale(0.85) rotate(5)">
              <g style={{ transformOrigin: '28px 18px', animation: 'filmReelSpin 6s linear infinite' }}>
                <circle cx="28" cy="18" r="14" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="28" cy="18" r="4" fill="#1A1A1A" />
                <line x1="28" y1="6" x2="28" y2="12" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="28" y1="24" x2="28" y2="30" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="16" y1="18" x2="22" y2="18" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="34" y1="18" x2="40" y2="18" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              <g style={{ transformOrigin: '56px 18px', animation: 'filmReelSpin 6s linear infinite' }}>
                <circle cx="56" cy="18" r="14" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="56" cy="18" r="4" fill="#1A1A1A" />
                <line x1="56" y1="6" x2="56" y2="12" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="56" y1="24" x2="56" y2="30" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="44" y1="18" x2="50" y2="18" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="62" y1="18" x2="68" y2="18" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              <rect x="8" y="30" width="68" height="52" rx="10" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              
              <circle
                cx="18"
                cy="40"
                r="4.5"
                fill="#FF2E2E"
                stroke="#1A1A1A"
                strokeWidth="1.5"
                style={{
                  animation: 'cameraTallyFlicker 1.2s infinite',
                }}
              />

              <path
                d="M76 43L104 28V84L76 69V43Z"
                fill="#E8E4DA"
                stroke="#1A1A1A"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              <circle
                cx="92"
                cy="56"
                r="6"
                fill="#FFC629"
                opacity="0.6"
                style={{
                  animation: 'cameraLensFlash 2s ease-in-out infinite',
                }}
              />

              <circle cx="36" cy="56" r="5" fill="#1A1A1A" />
              <line x1="48" y1="56" x2="68" y2="56" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* 5. COFFEE TO-GO CUP WITH CONTINUOUS STEAM (Far Left Middle) */}
            <g transform="translate(150, 195) scale(0.8) rotate(8)">
              <path d="M12 20H58L54 12H16L12 20Z" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4" strokeLinejoin="round" />
              <path d="M15 20L22 86H48L55 20" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.2" strokeLinejoin="round" />
              <path d="M18 42L20 66H50L52 42H18Z" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="3.5" strokeLinejoin="round" />
              <path
                d="M30 8C28 4 32 2 30 -2"
                stroke="#1A1A1A"
                strokeWidth="2.8"
                strokeLinecap="round"
                style={{
                  animation: 'steamRise1 2s ease-in-out infinite',
                  transformOrigin: '30px 8px',
                }}
              />
              <path
                d="M40 8C38 4 42 2 40 -2"
                stroke="#1A1A1A"
                strokeWidth="2.8"
                strokeLinecap="round"
                style={{
                  animation: 'steamRise2 2.3s ease-in-out 0.5s infinite',
                  transformOrigin: '40px 8px',
                }}
              />
            </g>

            {/* 6. PERSON WORKING AT DESK WITH CODE SCREEN (Bottom Left) */}
            <g transform="translate(145, 335) scale(0.85)">
              <path d="M20 90L34 50L48 60" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
              <path d="M42 50L58 64L46 72Z" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="52" cy="100" r="15" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <path d="M32 155C32 130 44 120 60 120C74 120 84 130 86 155" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M58 132L94 140" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
              <rect x="100" y="85" width="60" height="46" rx="6" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <line x1="110" y1="98" x2="148" y2="98" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="110" y1="108" x2="136" y2="108" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="110" y1="118" x2="140" y2="118" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line
                x1="145"
                y1="114"
                x2="145"
                y2="122"
                stroke="#FFC629"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ animation: 'screenCursorBlink 0.9s infinite' }}
              />
              <path d="M130 131V146M118 146H142" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="155" x2="175" y2="155" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
            </g>

            {/* 7. CONTINUOUSLY ROTATING GEARS (Bottom Center) */}
            <g transform="translate(440, 435) scale(0.85)">
              <g style={{ transformOrigin: '36px 36px', animation: 'gearSpinCw 12s linear infinite' }}>
                <circle cx="36" cy="36" r="20" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="36" cy="36" r="8" fill="#ECE8DF" stroke="#1A1A1A" strokeWidth="3" />
                <rect x="32" y="8" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="32" y="56" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="8" y="32" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="56" y="32" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="15" y="15" width="8" height="8" rx="2" fill="#1A1A1A" transform="rotate(45 19 19)" />
                <rect x="45" y="45" width="8" height="8" rx="2" fill="#1A1A1A" transform="rotate(45 49 49)" />
                <rect x="15" y="45" width="8" height="8" rx="2" fill="#1A1A1A" transform="rotate(45 19 49)" />
                <rect x="45" y="15" width="8" height="8" rx="2" fill="#1A1A1A" transform="rotate(45 49 19)" />
              </g>
              
              <g transform="translate(48, 16)">
                <g style={{ transformOrigin: '20px 20px', animation: 'gearSpinCcw 8s linear infinite' }}>
                  <circle cx="20" cy="20" r="14" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="3.5" />
                  <circle cx="20" cy="20" r="5" fill="#ECE8DF" stroke="#1A1A1A" strokeWidth="2.5" />
                  <rect x="17" y="2" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                  <rect x="17" y="32" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                  <rect x="2" y="17" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                  <rect x="32" y="17" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                </g>
              </g>
            </g>

            {/* 8. CHECKLIST WITH CONTINUOUS WRITING/CHECKING PENCIL (Bottom Right) */}
            <g transform="translate(660, 310) scale(0.85) rotate(6)">
              <rect x="18" y="24" width="104" height="116" rx="12" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <path
                d="M18 36C18 29.37 23.37 24 30 24H110C116.63 24 122 29.37 122 36V46H18V36Z"
                fill="#FFC629"
                stroke="#1A1A1A"
                strokeWidth="4"
              />
              <circle cx="38" cy="24" r="4.5" fill="#1A1A1A" />
              <circle cx="68" cy="24" r="4.5" fill="#1A1A1A" />
              <circle cx="98" cy="24" r="4.5" fill="#1A1A1A" />
              
              <path
                d="M34 65L40 71L54 57"
                stroke="#1A1A1A"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'checkmarkPulse 4s infinite' }}
              />
              <line x1="62" y1="65" x2="104" y2="65" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              
              <path
                d="M34 87L40 93L54 79"
                stroke="#1A1A1A"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'checkmarkPulse 4s infinite 1.5s' }}
              />
              <line x1="62" y1="87" x2="98" y2="87" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              
              <line x1="34" y1="108" x2="88" y2="108" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="3 4" />

              <g
                style={{
                  animation: 'pencilCheck 4s ease-in-out infinite',
                  transformOrigin: '0px 0px',
                }}
              >
                {/* Sharpened Wood Cone */}
                <path d="M0 0L-4.5 -10H4.5L0 0Z" fill="#ECE8DF" stroke="#1A1A1A" strokeWidth="2.5" strokeLinejoin="round" />
                {/* Graphite Lead Tip */}
                <path d="M0 0L-2 -4.5H2L0 0Z" fill="#1A1A1A" />
                {/* Yellow Hexagonal Body */}
                <rect x="-4.5" y="-34" width="9" height="24" rx="1.5" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
                {/* Metal Ferrule Band */}
                <rect x="-4.5" y="-38" width="9" height="4" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="2.5" />
                {/* Eraser Tip */}
                <path d="M-4.5 -38C-4.5 -42 4.5 -42 4.5 -38" fill="#FFC629" stroke="#1A1A1A" strokeWidth="2.5" />
              </g>
            </g>

            {/* 9. APP WINDOW / CHAT PREVIEW (Far Right Middle) */}
            <g transform="translate(710, 200) scale(0.8) rotate(-6)">
              <rect x="10" y="10" width="80" height="60" rx="10" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4" />
              <line x1="22" y1="26" x2="68" y2="26" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="38" x2="56" y2="38" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="50" x2="44" y2="50" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 10. CONTINUOUS TWINKLING SPARKLE STARS (✦) */}
            <g transform="translate(775, 450)" style={{ transformOrigin: '791px 466px', animation: 'starTwinkle 3s ease-in-out infinite' }}>
              <path d="M16 0L20 12L32 16L20 20L16 32L12 20L0 16L12 12L16 0Z" fill="#1A1A1A" />
            </g>
            <g transform="translate(770, 120)" style={{ transformOrigin: '782px 132px', animation: 'starTwinkle 2.5s ease-in-out 0.8s infinite' }}>
              <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z" fill="#1A1A1A" />
            </g>
          </svg>

          {/* MOBILE & TABLET / PORTRAIT VERTICAL SVG DOODLES */}
          <svg
            viewBox="0 0 540 960"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="tapestry-portrait w-full h-full absolute inset-0"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Top Left: Briefcase */}
            <g transform="translate(45, 115) rotate(-6) scale(0.85)">
              <path
                d="M48 24V14C48 9.58 51.58 6 56 6H80C84.42 6 88 9.58 88 14V24"
                stroke="#1A1A1A"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <rect x="8" y="24" width="120" height="82" rx="16" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <path d="M8 48C36 58 100 58 128 48" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
              <rect x="34" y="40" width="13" height="20" rx="3" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3.5" />
              <rect x="88" y="40" width="13" height="20" rx="3" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3.5" />
              <circle cx="68" cy="56" r="3.5" fill="#1A1A1A" />
            </g>

            {/* Top Center-Right: Searching Magnifying Glass */}
            <g
              style={{
                animation: 'magnifierSearchMobile 6s ease-in-out infinite',
                transformOrigin: '30px 30px',
              }}
            >
              <circle
                cx="30"
                cy="30"
                r="16"
                stroke="#FFC629"
                strokeWidth="2.5"
                fill="none"
                style={{
                  transformOrigin: '30px 30px',
                  animation: 'searchPulseRadar 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                }}
              />
              <circle cx="30" cy="30" r="24" fill="#F4EFE6" stroke="#1A1A1A" strokeWidth="4.5" />
              <line x1="30" y1="20" x2="30" y2="40" stroke="#FFC629" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <line x1="20" y1="30" x2="40" y2="30" stroke="#FFC629" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <circle cx="30" cy="30" r="3" fill="#1A1A1A" />
              <path d="M20 18C25 15 35 15 40 18" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="48" y1="48" x2="75" y2="75" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* Upper Right: Coffee Cup */}
            <g transform="translate(390, 115) scale(0.85)">
              <path
                d="M25 18C23 10 28 6 25 1"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ animation: 'steamRise1 2.2s ease-in-out infinite' }}
              />
              <path
                d="M38 19C36 11 41 7 38 2"
                stroke="#1A1A1A"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ animation: 'steamRise2 2.6s ease-in-out 0.4s infinite' }}
              />
              <path
                d="M16 28H60V50C60 62.15 50.15 72 38 72C25.85 72 16 62.15 16 50V28Z"
                fill="#E8E4DA"
                stroke="#1A1A1A"
                strokeWidth="4.5"
              />
              <path d="M60 36C68 36 74 40 74 48C74 56 68 60 60 60" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M8 77H68" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
            </g>

            {/* Middle Left: Video Camera */}
            <g transform="translate(35, 300) scale(0.8) rotate(-4)">
              <g style={{ transformOrigin: '28px 18px', animation: 'filmReelSpin 6s linear infinite' }}>
                <circle cx="28" cy="18" r="14" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="28" cy="18" r="4" fill="#1A1A1A" />
              </g>
              <g style={{ transformOrigin: '56px 18px', animation: 'filmReelSpin 6s linear infinite' }}>
                <circle cx="56" cy="18" r="14" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="56" cy="18" r="4" fill="#1A1A1A" />
              </g>
              <rect x="8" y="30" width="68" height="52" rx="10" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <circle cx="18" cy="40" r="4.5" fill="#FF2E2E" stroke="#1A1A1A" strokeWidth="1.5" style={{ animation: 'cameraTallyFlicker 1.2s infinite' }} />
              <path d="M76 43L104 28V84L76 69V43Z" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
            </g>

            {/* Middle Right: To-Go Cup */}
            <g transform="translate(415, 300) scale(0.8) rotate(6)">
              <path d="M12 20H58L54 12H16L12 20Z" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4" />
              <path d="M15 20L22 86H48L55 20" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.2" />
              <path d="M18 42L20 66H50L52 42H18Z" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="3.5" />
              <path d="M30 8C28 4 32 2 30 -2" stroke="#1A1A1A" strokeWidth="2.8" strokeLinecap="round" style={{ animation: 'steamRise1 2s ease-in-out infinite' }} />
            </g>

            {/* Sparkles */}
            <g transform="translate(425, 230)" style={{ transformOrigin: '437px 242px', animation: 'starTwinkle 2.5s ease-in-out infinite' }}>
              <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z" fill="#1A1A1A" />
            </g>
            <g transform="translate(45, 590)" style={{ transformOrigin: '55px 600px', animation: 'starTwinkle 3s ease-in-out 1s infinite' }}>
              <path d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z" fill="#1A1A1A" />
            </g>

            {/* Bottom Left: Coder at Desk */}
            <g transform="translate(30, 750) scale(0.82)">
              <circle cx="52" cy="100" r="15" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <path d="M32 155C32 130 44 120 60 120C74 120 84 130 86 155" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" />
              <rect x="100" y="85" width="60" height="46" rx="6" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <line x1="110" y1="98" x2="148" y2="98" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="110" y1="108" x2="136" y2="108" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="145" y1="114" x2="145" y2="122" stroke="#FFC629" strokeWidth="3.5" strokeLinecap="round" style={{ animation: 'screenCursorBlink 0.9s infinite' }} />
              <path d="M130 131V146M118 146H142" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="155" x2="175" y2="155" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
            </g>

            {/* Bottom Center: Rotating Gears */}
            <g transform="translate(235, 780) scale(0.82)">
              <g style={{ transformOrigin: '36px 36px', animation: 'gearSpinCw 12s linear infinite' }}>
                <circle cx="36" cy="36" r="20" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
                <circle cx="36" cy="36" r="8" fill="#ECE8DF" stroke="#1A1A1A" strokeWidth="3" />
                <rect x="32" y="8" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="32" y="56" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="8" y="32" width="8" height="8" rx="2" fill="#1A1A1A" />
                <rect x="56" y="32" width="8" height="8" rx="2" fill="#1A1A1A" />
              </g>
              <g transform="translate(48, 16)">
                <g style={{ transformOrigin: '20px 20px', animation: 'gearSpinCcw 8s linear infinite' }}>
                  <circle cx="20" cy="20" r="14" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="3.5" />
                  <rect x="17" y="2" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                  <rect x="17" y="32" width="6" height="6" rx="1.5" fill="#1A1A1A" />
                </g>
              </g>
            </g>

            {/* Bottom Right: Checklist with Pencil */}
            <g transform="translate(370, 740) scale(0.8) rotate(4)">
              <rect x="18" y="24" width="104" height="116" rx="12" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="4.5" />
              <path d="M18 36C18 29.37 23.37 24 30 24H110C116.63 24 122 29.37 122 36V46H18V36Z" fill="#FFC629" stroke="#1A1A1A" strokeWidth="4" />
              <circle cx="38" cy="24" r="4.5" fill="#1A1A1A" />
              <circle cx="68" cy="24" r="4.5" fill="#1A1A1A" />
              <path d="M34 65L40 71L54 57" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="62" y1="65" x2="104" y2="65" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M34 87L40 93L54 79" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="62" y1="87" x2="98" y2="87" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="34" y1="108" x2="88" y2="108" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="3 4" />
              <g
                style={{
                  animation: 'pencilCheck 4s ease-in-out infinite',
                  transformOrigin: '0px 0px',
                }}
              >
                {/* Sharpened Wood Cone */}
                <path d="M0 0L-4.5 -10H4.5L0 0Z" fill="#ECE8DF" stroke="#1A1A1A" strokeWidth="2.5" strokeLinejoin="round" />
                {/* Graphite Lead Tip */}
                <path d="M0 0L-2 -4.5H2L0 0Z" fill="#1A1A1A" />
                {/* Yellow Hexagonal Body */}
                <rect x="-4.5" y="-34" width="9" height="24" rx="1.5" fill="#FFC629" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
                {/* Metal Ferrule Band */}
                <rect x="-4.5" y="-38" width="9" height="4" fill="#E8E4DA" stroke="#1A1A1A" strokeWidth="2.5" />
                {/* Eraser Tip */}
                <path d="M-4.5 -38C-4.5 -42 4.5 -42 4.5 -38" fill="#FFC629" stroke="#1A1A1A" strokeWidth="2.5" />
              </g>
            </g>
          </svg>
        </motion.div>

        {/* ========================================================================= */}
        {/* CENTER FOREGROUND: GIGLY KINETIC LOGO ANIMATION STAGE                     */}
        {/* ========================================================================= */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-[500px] w-full my-auto sm:my-0 py-8 sm:py-0">
          
          {/* Top Tag: #SwipeToEarn */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{
              opacity: stage === 'final-lockup' || stage === 'cta-ready' ? 1 : 0,
              y: stage === 'final-lockup' || stage === 'cta-ready' ? 0 : -8,
            }}
            transition={{ duration: 0.4 }}
            className="text-[12px] sm:text-[13px] font-bold text-[#66635C] tracking-wide mb-1"
          >
            #SwipeToEarn
          </motion.div>

          {/* Kinetic Logo Stage: 3x3 Grid -> Merge Block -> Wipe Text -> Gigly. Lockup */}
          <div className="relative flex items-center justify-center min-h-[90px] w-full my-1">
            
            {/* STAGES 1 TO 3: SQUARE & 3x3 GRID MATRIX & MERGE BLOCK */}
            {(stage === 'initial-square' || stage === 'grid-3x3' || stage === 'merge-left') && (
              <div className="relative flex items-center justify-center w-[160px] h-[100px]">
                {stage === 'initial-square' && (
                  <motion.div
                    key="init-sq"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-12 h-12 bg-[#FFC629] border-[3px] border-black rounded-[8px] shadow-[3px_3px_0px_0px_#000]"
                  />
                )}

                {stage === 'grid-3x3' && (
                  <motion.div
                    key="grid-3x3"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-3 gap-2 w-[110px] h-[110px]"
                  >
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          scale: 0.2,
                          x: (i % 3 - 1) * -10,
                          y: (Math.floor(i / 3) - 1) * -10,
                        }}
                        animate={{
                          scale: 1,
                          x: 0,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: i * 0.02,
                          ease: [0.34, 1.56, 0.64, 1], // bouncy spring expansion
                        }}
                        className={`w-full h-full rounded-[5px] border-[2px] border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
                          i % 2 === 0 ? 'bg-[#FFC629]' : 'bg-[#1A1A1A]'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}

                {stage === 'merge-left' && (
                  <motion.div
                    key="merge-block"
                    initial={{ scale: 1.2, x: 0, opacity: 0.8 }}
                    animate={{ scale: 1, x: -120, opacity: 1 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    className="w-16 h-16 bg-[#FFC629] border-[3.5px] border-black rounded-[10px] shadow-[4px_4px_0px_0px_#000]"
                  />
                )}
              </div>
            )}

            {/* STAGES 4, 5, & 6: GIGLY WORDMARK REVEAL & SIGNATURE YELLOW DOT LOCKUP */}
            {(stage === 'wipe-text' || stage === 'final-lockup' || stage === 'cta-ready') && (
              <div className="relative flex items-center justify-center">
                
                {/* Wordmark "Gigly" with Left-to-Right Reveal Wipe matching exact uploaded logo */}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden whitespace-nowrap pr-1"
                >
                  <span
                    className="font-black text-[60px] sm:text-[76px] text-black leading-none inline-block select-none"
                    style={{
                      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    Gigly
                  </span>
                </motion.div>

                {/* Kinetic Traveling Block that morphs into the Signature Yellow Dot */}
                <motion.div
                  initial={{
                    x: stage === 'wipe-text' ? -45 : 0,
                    width: stage === 'wipe-text' ? 44 : 20,
                    height: stage === 'wipe-text' ? 36 : 20,
                    borderRadius: stage === 'wipe-text' ? 8 : 9999,
                  }}
                  animate={{
                    x: 0,
                    width: [38, 24, 20],
                    height: [32, 22, 20],
                    y: [0, 4, 6], // sits cleanly beside the lowercase 'y'
                    borderRadius: [8, 9999, 9999],
                    backgroundColor: ['#FFC629', '#FFC629', '#FFC629'],
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="bg-[#FFC629] border-[2.5px] sm:border-[3px] border-black inline-block flex-shrink-0 ml-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.5)]"
                />
              </div>
            )}

          </div>

          {/* Tagline, Get Started CTA, & Footnote */}
          <AnimatePresence>
            {(stage === 'final-lockup' || stage === 'cta-ready') && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center w-full"
              >
                {/* Tagline */}
                <p className="text-[15px] sm:text-[17px] font-semibold text-[#3D3A35] leading-snug tracking-tight mb-5 text-center">
                  <span>Swipe your way to your next gig</span>
                  <span className="text-[#262420] block">— or your next hire.</span>
                </p>

                {/* Get Started Button */}
                <motion.button
                  id="btn-get-started"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onStart}
                  className="px-8 sm:px-10 py-3.5 sm:py-4 bg-black text-white font-display font-[800] text-[15px] sm:text-[16px] rounded-full border-[2.5px] border-black cursor-pointer shadow-[0px_4px_14px_rgba(0,0,0,0.18)] hover:bg-[#1A1A1A] transition-all mb-4"
                >
                  Get Started
                </motion.button>

                {/* Footnote */}
                <p className="text-[11.5px] sm:text-[12.5px] font-semibold text-[#66635C] tracking-tight">
                  No spam. No cold DMs. Just matches.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
