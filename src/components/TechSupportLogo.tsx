import React from 'react';

interface TechSupportLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const TechSupportLogo: React.FC<TechSupportLogoProps> = ({ 
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
      {/* High-End Tech Support Emblem */}
      <div className={`relative ${box} rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 p-[1.5px] shadow-lg shadow-blue-500/20 group cursor-pointer transition-transform duration-200 active:scale-95`}>
        {/* Ambient Halo Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/30 to-sky-400/30 blur-xs -z-10 group-hover:blur-sm transition-all" />
        
        {/* Dark Core Container */}
        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          
          {/* Circuit / Tech Matrix Background Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:5px_5px]" />
          
          {/* Custom Crafted Tech Support "TS" Shield & Precision Tool Vector */}
          <svg
            className={`${icon} text-blue-500 transition-transform duration-300 group-hover:scale-105`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="tsGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="tsGradGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>

            {/* Shield / Armor Backdrop Border */}
            <path
              d="M24 4L7 11V22C7 32.5 14.2 42.1 24 44.5C33.8 42.1 41 32.5 41 22V11L24 4Z"
              stroke="url(#tsGradPrimary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(59, 130, 246, 0.08)"
            />

            {/* "T" Bar in Tech Support */}
            <path
              d="M13 14H35"
              stroke="url(#tsGradGlow)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M24 14V34"
              stroke="url(#tsGradGlow)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* "S" Curve intertwined / Support Spark */}
            <path
              d="M18 21C18 19 20 18 24 18C28 18 30 20 30 22C30 26 18 25 18 29C18 32 20.5 33 24 33C28 33 30 31.5 30 30"
              stroke="url(#tsGradPrimary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Central Precision Tech Pulse Indicator */}
            <circle cx="24" cy="7.5" r="2" fill="#DBEAFE" />
            <circle cx="24" cy="38" r="1.5" fill="#3B82F6" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-sans text-base sm:text-lg">
              TECH <span className="text-blue-500 dark:text-blue-400">SUPPORT</span>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
            Private Vault & Tools
          </span>
        </div>
      )}
    </div>
  );
};
