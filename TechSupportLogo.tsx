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
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-base' },
    lg: { box: 'w-11 h-11', icon: 'w-6 h-6', text: 'text-lg' },
    xl: { box: 'w-14 h-14', icon: 'w-8 h-8', text: 'text-xl' }
  };

  const { box, icon } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Clean Google-style Minimalist Tech Support Emblem */}
      <div className={`relative ${box} rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 select-none shrink-0`}>
        {/* Subtle Google-style 4-quadrant geometric tech emblem */}
        <svg
          className={`${icon} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer Protective Tech Shield */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {/* Tech Bolt / Support Vector */}
          <path d="m9 12 2 2 4-4" strokeWidth="2.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
              Tech<span className="text-blue-600 dark:text-blue-400 font-bold">Support</span>
            </span>
          </div>
          <span className="text-[10px] tracking-wide text-zinc-500 dark:text-zinc-400 font-medium">
            Resource Catalog
          </span>
        </div>
      )}
    </div>
  );
};

