import { motion } from 'motion/react';
import { Compass, Heart, MessageSquare, User, Shield } from 'lucide-react';
import { AppScreen } from '../types';

interface NavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  matchesBadgeCount: number;
  messagesBadgeCount: number;
  isAdmin?: boolean;
}

export function Navbar({
  currentScreen,
  onNavigate,
  matchesBadgeCount,
  messagesBadgeCount,
  isAdmin = false,
}: NavbarProps) {
  const tabs = [
    {
      id: 'explore' as AppScreen,
      label: 'Explore',
      icon: Compass,
    },
    {
      id: 'matches' as AppScreen,
      label: 'Matches',
      icon: Heart,
      badge: matchesBadgeCount,
    },
    {
      id: 'messages' as AppScreen,
      label: 'Messages',
      icon: MessageSquare,
      badge: messagesBadgeCount,
    },
    {
      id: 'profile' as AppScreen,
      label: 'Profile',
      icon: User,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as AppScreen,
            label: 'Admin',
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t-[3px] border-black flex items-center justify-center z-40 select-none">
      <div className="w-full max-w-[440px] flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-2 cursor-pointer group"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-200 stroke-[2.3] ${
                    isActive
                      ? 'text-black -translate-y-0.5'
                      : 'text-[#8E8E8E] group-hover:text-black'
                  }`}
                />
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC629] border-[1.5px] border-black text-black font-display font-black text-[10px] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000] ${
                      tab.id === 'messages' ? 'animate-bounce' : ''
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`font-display text-[11px] mt-1 transition-colors flex items-center gap-1 ${
                  isActive ? 'font-extrabold text-black' : 'font-semibold text-[#8E8E8E]'
                }`}
              >
                {tab.label}
                {tab.id === 'messages' && !!tab.badge && tab.badge > 0 && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC629] border border-black inline-block" />
                )}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
                  className="w-1.5 h-1.5 rounded-full bg-[#FFC629] border border-black absolute -bottom-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
