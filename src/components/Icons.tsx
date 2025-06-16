
import React from 'react';

export const FilledFile = ({ className = "w-4 h-4", color = "text-gray-500" }: { className?: string; color?: string }) => (
  <svg className={`${className} ${color}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
);

export const FilledFolder = ({ className = "w-4 h-4", color = "text-blue-500" }: { className?: string; color?: string }) => (
  <svg className={`${className} ${color}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
  </svg>
);
