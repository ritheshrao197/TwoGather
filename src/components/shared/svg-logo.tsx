import React from 'react';

interface SvgLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SvgLogo({ className = '', size = 'md' }: SvgLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center relative`}>
        <div className="w-2 h-2 rounded-full bg-primary"></div>
        <div className="absolute w-4 h-0.5 bg-primary rounded-full"></div>
      </div>
    </div>
  );
}