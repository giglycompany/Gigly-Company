import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  getCurrencyBySymbolOrCode,
} from '../lib/currency';

interface CurrencyDropdownProps {
  value?: string; // symbol (e.g. '$', '€', '₹') or code (e.g. 'USD', 'EUR', 'INR')
  onChange: (currency: CurrencyInfo) => void;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badge' | 'input-prefix' | 'pill';
  className?: string;
  label?: string;
}

export function CurrencyDropdown({
  value = '$',
  onChange,
  size = 'sm',
  variant = 'badge',
  className = '',
  label,
}: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCurrency = getCurrencyBySymbolOrCode(value);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (currency: CurrencyInfo) => {
    onChange(currency);
    setIsOpen(false);
  };

  // Button sizes
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] h-6 rounded-md',
    sm: 'px-2.5 py-1 text-[11.5px] h-7 rounded-lg',
    md: 'px-3 py-1.5 text-[12.5px] h-9 rounded-xl',
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={label || `Change currency (Current: ${currentCurrency.name})`}
        className={`bg-[#FFF9E6] hover:bg-[#FFC629] text-black font-extrabold border-[1.5px] border-black transition-all cursor-pointer flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000] active:translate-y-[0.5px] select-none ${sizeClasses} ${
          isOpen ? 'ring-2 ring-black bg-[#FFC629]' : ''
        }`}
      >
        <span className="text-[13px] leading-none">{currentCurrency.flag}</span>
        <span className="font-display font-[800] tracking-wide text-black">
          {currentCurrency.symbol}
        </span>
        <span className="text-[10px] font-bold text-[#555] uppercase">
          {currentCurrency.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-black transition-transform duration-200 stroke-[2.5] ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 right-0 min-w-[210px] bg-white border-[2.5px] border-black rounded-2xl p-1.5 shadow-[4px_5px_0px_0px_#000] animate-in fade-in zoom-in-95 duration-100"
          style={{ transformOrigin: 'top right' }}
        >
          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#777] border-b border-black/10 mb-1 flex items-center justify-between">
            <span>Select Currency</span>
            <span className="text-[9px] font-bold text-black bg-[#FFC629] px-1 rounded">
              7 Currencies
            </span>
          </div>

          <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto custom-scrollbar-y">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = c.code === currentCurrency.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer text-[12px] ${
                    isSelected
                      ? 'bg-[#FFC629] font-black text-black border border-black shadow-[1px_1px_0px_0px_#000]'
                      : 'hover:bg-[#FFF9E6] text-[#222] font-semibold border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px] leading-none">{c.flag}</span>
                    <span className="font-display font-[800] text-[13px] text-black">
                      {c.symbol}
                    </span>
                    <span className="text-[11px] font-bold text-[#444] truncate">
                      {c.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-black text-[#FFC629]'
                          : 'bg-black/5 text-[#666]'
                      }`}
                    >
                      {c.code}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
