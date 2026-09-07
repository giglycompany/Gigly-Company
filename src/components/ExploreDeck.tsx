import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { X, Star, Heart, RotateCcw, Sparkles, Filter, Check, ChevronDown, Briefcase } from 'lucide-react';
import { GigItem, GigCategory, GIG_CATEGORIES } from '../types';
import { GiglyLogo } from './GiglyLogo';

interface ExploreDeckProps {
  items: GigItem[];
  role: 'freelancer' | 'business';
  matchesCount: number;
  onSwipe: (item: GigItem, direction: 'left' | 'right' | 'up') => void;
  onReshuffle: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ExploreDeck({ items, role, matchesCount, onSwipe, onReshuffle }: ExploreDeckProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Click & Drag Horizontal Scroll State
  const filterScrollRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!filterScrollRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - filterScrollRef.current.offsetLeft;
    scrollLeftRef.current = filterScrollRef.current.scrollLeft;
    setIsMouseDown(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    filterScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsMouseDown(false);
  };

  // Filter items based on selected category and swiped state
  const availableItems = useMemo(() => {
    return items.filter((item) => {
      const notSwiped = !swipedIds.has(item.id);
      if (selectedCategory === 'All') return notSwiped;
      return notSwiped && item.category === selectedCategory;
    });
  }, [items, selectedCategory, swipedIds]);

  // Compute item count per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    items.forEach((item) => {
      if (!swipedIds.has(item.id)) {
        counts.All = (counts.All || 0) + 1;
        if (item.category) {
          counts[item.category] = (counts[item.category] || 0) + 1;
        }
      }
    });
    return counts;
  }, [items, swipedIds]);

  const handleCardSwipe = (direction: 'left' | 'right' | 'up') => {
    if (availableItems.length === 0) return;
    const topCard = availableItems[0];
    setSwipedIds((prev) => new Set([...prev, topCard.id]));
    onSwipe(topCard, direction);
  };

  const handleResetDeck = () => {
    setSwipedIds(new Set());
    onReshuffle();
  };

  const visibleCards = availableItems.slice(0, 3);
  const filterList: string[] = ['All', ...GIG_CATEGORIES];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Stats */}
      <header className="w-full flex items-center justify-between mb-3">
        <GiglyLogo size="md" />
        <div className="text-right text-[11px] font-semibold text-[#6E6E6E] leading-tight">
          <div>
            <b className="text-black font-extrabold text-[13px]">{matchesCount}</b> matches today
          </div>
          <div>
            <b className="text-black font-extrabold text-[13px]">{swipedIds.size}</b> profiles viewed
          </div>
        </div>
      </header>

      {/* Tagline */}
      <div className="w-full font-display font-bold text-[13.5px] text-black mb-3">
        {role === 'freelancer' ? (
          <>
            Swipe right on work worth doing.{' '}
            <span className="bg-[#FFC629] px-2 py-0.5 rounded-md border border-black/10 inline-block font-extrabold">
              You make the first move.
            </span>
          </>
        ) : (
          <>
            Swipe right on talent worth hiring.{' '}
            <span className="bg-[#FFC629] px-2 py-0.5 rounded-md border border-black/10 inline-block font-extrabold">
              Find your next builder.
            </span>
          </>
        )}
      </div>

      {/* TOP FILTERS: HORIZONTALLY SCROLLABLE WORK / SKILL PILLS */}
      <div className="w-full mb-3.5">
        <div className="relative flex items-center justify-between gap-1 mb-2 px-0.5" ref={dropdownRef}>
          {/* Workable Filter Dropdown Button */}
          <button
            id="filter-dropdown-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-display font-[800] transition-all cursor-pointer border-[2px] border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] ${
              isDropdownOpen || selectedCategory !== 'All'
                ? 'bg-[#FFC629] text-black'
                : 'bg-white text-[#1A1A1A] hover:bg-[#FFFDF7]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>
              {selectedCategory === 'All'
                ? `Filter (${role === 'freelancer' ? 'All 13 Works' : 'All 13 Categories'})`
                : `${selectedCategory} (${categoryCounts[selectedCategory] || 0})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-black stroke-[2.5] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-[11px] font-bold text-[#6E6E6E] hover:text-black underline underline-offset-2 cursor-pointer transition-colors"
            >
              Show All ({categoryCounts['All'] || 0})
            </button>
          )}

          {/* POPUP DROPDOWN MENU WITH ALL 13 WORKS */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[290px] sm:w-[320px] max-h-[380px] bg-[#FFFCF5] border-[2.5px] border-black rounded-[20px] shadow-[6px_8px_0px_0px_#000] p-2.5 flex flex-col overflow-hidden"
              >
                {/* Dropdown Header */}
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/15 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span className="text-[11.5px] font-display font-[800] text-black uppercase tracking-wider">
                      Select Work / Category (13)
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#6E6E6E]">
                    {availableItems.length} active
                  </span>
                </div>

                {/* Dropdown Scrollable List */}
                <div className="custom-scrollbar-y max-h-[290px] pr-1.5 space-y-1">
                  {filterList.map((cat, idx) => {
                    const isSelected = selectedCategory === cat;
                    const count = categoryCounts[cat] || 0;

                    return (
                      <button
                        key={cat}
                        id={`filter-opt-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all cursor-pointer border-[1.5px] ${
                          isSelected
                            ? 'bg-[#FFC629] text-black font-display font-[800] border-black shadow-[2px_2px_0px_0px_#000]'
                            : 'bg-white text-black font-semibold border-black/15 hover:border-black hover:bg-[#FAF6EC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold w-4 text-[#888]">
                            {idx === 0 ? '★' : `${idx}.`}
                          </span>
                          <span>{cat === 'All' ? 'All Works & Roles' : cat}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'bg-[#ECE8DF] text-[#555]'
                            }`}
                          >
                            {count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Filters Container with visible custom scrollbar */}
        <div className="relative -mx-5 px-5">
          <div
            ref={filterScrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-center gap-1.5 custom-scrollbar-x pb-2 pt-0.5 select-none ${
              isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {filterList.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    setSelectedCategory(cat);
                  }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] transition-all cursor-pointer select-none whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#FFC629] text-black font-display font-[800] border-[2px] border-black shadow-[2px_2px_0px_0px_#000] scale-[1.02]'
                      : 'bg-white text-[#4A4A4A] font-semibold border-[1.5px] border-black/25 hover:border-black hover:text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-black text-white'
                        : 'bg-[#ECE8DF] text-[#555]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deck Container */}
      <div className="relative w-full h-[470px] sm:h-[500px]">
        {visibleCards.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-white border-[3px] border-dashed border-black rounded-[26px] p-6 flex flex-col items-center justify-center text-center shadow-[4px_6px_0px_0px_#000]"
          >
            <div className="w-16 h-16 rounded-full bg-[#FFF9E6] border-2 border-black flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-[#FFC629] fill-[#FFC629]" />
            </div>
            <h3 className="font-display font-[800] text-[19px] text-black mb-1">
              {selectedCategory !== 'All'
                ? `No more "${selectedCategory}" cards!`
                : "You're all caught up!"}
            </h3>
            <p className="text-[12.5px] font-medium text-[#6E6E6E] max-w-[250px] mb-5">
              {selectedCategory !== 'All'
                ? `Switch to another filter category or reshuffle the entire ${role === 'freelancer' ? 'gigs' : 'talent'} deck.`
                : `Check back later for new ${role === 'freelancer' ? 'gigs' : 'freelancers'}, or reshuffle the deck.`}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[200px]">
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="py-2.5 px-4 bg-white text-black font-display font-[800] text-[12px] rounded-full border-[2px] border-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] hover:bg-[#F5F5F5] active:translate-y-[1px]"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>View All Categories</span>
                </button>
              )}
              <button
                onClick={handleResetDeck}
                className="py-2.5 px-4 bg-[#FFC629] text-black font-display font-[800] text-[12px] rounded-full border-[2px] border-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reshuffle Deck</span>
              </button>
            </div>
          </motion.div>
        ) : (
          visibleCards.map((job, index) => {
            const isTop = index === 0;
            return (
              <SwipeCard
                key={job.id}
                job={job}
                index={index}
                isTop={isTop}
                onSwipe={(dir) => handleCardSwipe(dir)}
              />
            );
          })
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-6 mt-5">
        {/* Pass Button */}
        <motion.button
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92, y: 2 }}
          onClick={() => handleCardSwipe('left')}
          disabled={visibleCards.length === 0}
          title="Pass"
          className="w-14 h-14 rounded-full bg-white border-[2.5px] border-black flex items-center justify-center shadow-[3px_4px_0px_0px_#000] cursor-pointer disabled:opacity-40"
        >
          <X className="w-6 h-6 text-black stroke-[3]" />
        </motion.button>

        {/* Priority Apply (Super Like) Button */}
        <motion.button
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92, y: 2 }}
          onClick={() => handleCardSwipe('up')}
          disabled={visibleCards.length === 0}
          title="Priority Apply"
          className="w-11 h-11 rounded-full bg-white border-[2.5px] border-black flex items-center justify-center shadow-[3px_4px_0px_0px_#000] cursor-pointer disabled:opacity-40"
        >
          <Star className="w-5 h-5 text-black fill-[#FFC629] stroke-[2.2]" />
        </motion.button>

        {/* Like / Apply Button */}
        <motion.button
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92, y: 2 }}
          onClick={() => handleCardSwipe('right')}
          disabled={visibleCards.length === 0}
          title="Apply / Match"
          className="w-14 h-14 rounded-full bg-[#FFC629] border-[2.5px] border-black flex items-center justify-center shadow-[3px_4px_0px_0px_#000] cursor-pointer disabled:opacity-40"
        >
          <Heart className="w-6 h-6 text-black fill-black stroke-[2.2]" />
        </motion.button>
      </div>

      {/* Disclaimer */}
      <footer className="mt-6 text-center text-[10.5px] text-[#787878] font-medium leading-relaxed max-w-[340px]">
        Concept demo — when you match, the proposal window is held for 24 hours before opening to other applicants.
      </footer>
    </div>
  );
}

interface SwipeCardProps {
  key?: string | number;
  job: GigItem;
  index: number;
  isTop: boolean;
  onSwipe: (dir: 'left' | 'right' | 'up') => void;
}

function SwipeCard({ job, index, isTop, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [15, 100], [0, 1]);
  const passOpacity = useTransform(x, [-15, -100], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    const velocityThreshold = 500;

    if (info.offset.y < -120 || info.velocity.y < -velocityThreshold) {
      onSwipe('up');
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    }
  };

  const depthOffset = index * 8;
  const depthScale = 1 - index * 0.035;

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : depthOffset,
        rotate: isTop ? rotate : 0,
        scale: depthScale,
        zIndex: 10 - index,
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className={`absolute inset-0 bg-white border-[3px] border-black rounded-[26px] p-5 sm:p-6 flex flex-col justify-between shadow-[8px_10px_0px_0px_#000] select-none ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
    >
      {/* Stamps */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 left-6 px-4 py-1.5 rounded-lg border-[3.5px] border-black bg-[#FFC629] text-black font-display font-[800] text-[24px] rotate-[-14deg] shadow-[2px_2px_0px_0px_#000] pointer-events-none z-20"
          >
            YES
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-6 right-6 px-4 py-1.5 rounded-lg border-[3.5px] border-black bg-black text-white font-display font-[800] text-[24px] rotate-[14deg] shadow-[2px_2px_0px_0px_#000] pointer-events-none z-20"
          >
            PASS
          </motion.div>
        </>
      )}

      {/* Card Content Top */}
      <div>
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="font-display font-[800] text-[28px] sm:text-[30px] text-black leading-none">
              {job.rate}
              <span className="text-[13px] font-semibold text-[#6E6E6E] ml-1 font-body">
                {job.unit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Category Pill Tag */}
            <div className="px-2.5 py-0.5 bg-[#FFF9E6] border-[1.5px] border-black rounded-full text-[10.5px] font-extrabold text-black">
              {job.category}
            </div>

            {job.hot ? (
              <div className="px-2.5 py-0.5 bg-[#FFC629] border-[1.5px] border-black rounded-full text-[10.5px] font-bold text-black flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                <span>★</span> hot
              </div>
            ) : (
              <div className="px-2 py-0.5 bg-white border-[1.5px] border-black/40 rounded-full text-[10px] font-bold text-[#6E6E6E]">
                ○ open
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display font-bold text-[19px] sm:text-[20px] text-black leading-tight mb-2">
          {job.title}
        </h2>

        {/* Client / Person Row */}
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6E6E6E] mb-2.5">
          <div className="w-6 h-6 rounded-full bg-[#FFC629] border-[1.5px] border-black flex items-center justify-center font-display font-[800] text-[10px] text-black">
            {getInitials(job.client)}
          </div>
          <span className="text-black font-bold">{job.client}</span>
        </div>

        {/* Description */}
        <div className="custom-scrollbar-y max-h-[110px] sm:max-h-[125px] pr-1">
          <p className="text-[13px] sm:text-[13.5px] font-normal text-[#3A3A3A] leading-relaxed">
            {job.desc}
          </p>
        </div>
      </div>

      {/* Card Content Bottom */}
      <div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 my-2.5">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.8 bg-[#FFFCF5] border-[1.5px] border-black rounded-full text-[10.5px] font-bold text-black"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t-2 border-dashed border-black/10 text-[11px] font-semibold text-[#6E6E6E]">
          <span>{job.posted}</span>
          <span>{job.proposals}</span>
        </div>
      </div>
    </motion.div>
  );
}
