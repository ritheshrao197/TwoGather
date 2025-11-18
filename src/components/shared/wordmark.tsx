import React from 'react';

interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-2xl font-headline">Between us</span>
    </div>
  );
}