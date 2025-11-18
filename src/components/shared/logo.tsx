import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-lg font-headline">Between us</span>
      <span className="text-xs font-caption">A private place to share, plan, and grow.</span>
    </div>
  );
}