import React from 'react';

interface CompanyLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  size = 'medium', 
  className = '', 
  showText = false 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Company Logo" 
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = `${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold`;
            fallback.textContent = 'M';
            parent.appendChild(fallback);
          }
        }}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold text-gray-300`}>
          Marcus
        </span>
      )}
    </div>
  );
};
