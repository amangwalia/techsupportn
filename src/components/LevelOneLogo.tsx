import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const LevelOneLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-sm' },
    md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-lg' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-xl' },
    xl: { box: 'w-16 h-16', icon: 'w-9 h-9', text: 'text-2xl' }
  };

  const { box, icon } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Modern High-End Level 1 Emblem */}
      <div className={`relative ${box} rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1.5px] shadow-lg shadow-orange-500/20 group cursor-pointer transition-transform duration-200 active:scale-95`}>
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-orange-500/30 to-amber-400/30 blur-xs -z-10 group-hover:blur-sm transition-all" />
        
        {/* Inner Core Container */}
        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          
          {/* Subtle Grid Accent Background */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:6px_6px]" />
          
          {/* Custom Crafted Geometric L1 Monogram Vector */}
          <svg
            className={`${icon} text-orange-500 transition-transform duration-300 group-hover:scale-105`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="l1GradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="l1GradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* "L" Shape - Clean Geometric Path */}
            <path
              d="M10 10V34C10 36.2091 11.7909 38 14 38H26C27.1046 38 28 37.1046 28 36C28 34.8954 27.1046 34 26 34H16V10C16 8.89543 15.1046 8 14 8C12.8954 8 10 8.89543 10 10Z"
              fill="url(#l1GradOrange)"
            />

            {/* "1" Shape - Modern Angled Pillar */}
            <path
              d="M32 12.8L28.2 15.6C27.3 16.3 26 15.7 26 14.6V13.8C26 13 26.4 12.3 27.1 11.8L31.2 8.7C32.1 8 33.4 8.7 33.4 9.8V36C33.4 37.1046 34.2954 38 35.4 38H36.6C37.7046 38 38.6 37.1046 38.6 36V12.8C38.6 10.5 35.8 9.3 34 10.6L32 12.8Z"
              fill="url(#l1GradAccent)"
            />

            {/* Tech Diamond Dot Accent */}
            <circle cx="36" cy="11" r="2.2" fill="#FEF08A" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-sans text-base sm:text-lg">
              LEVEL <span className="text-orange-500">1</span>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
            Dev Vault
          </span>
        </div>
      )}
    </div>
  );
};
