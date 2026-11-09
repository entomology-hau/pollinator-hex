import React from 'react';

interface Props { size?: number; className?: string }

/** Red mason bee (Osmia bicornis), with rufous hair rather than yellow bands. */
export const SolitaryBeeIcon: React.FC<Props> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g stroke="#ba956d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M27 24 19 18 16 10 M37 24 45 18 48 10" />
      <path d="M26 29 14 34 4 36 M38 29 50 34 60 36" />
      <path d="M27 34 19 42 18 53 M37 34 45 42 46 53" />
    </g>
    <g fill="#e1e9ed" fillOpacity=".8" stroke="#99b3c4" strokeWidth="1.2">
      <path d="M29 29C20 30 10 38 13 43c3 5 11 0 17-7Z" />
      <path d="M35 29c9 1 19 9 16 14-3 5-11 0-17-7Z" />
      <path d="M29 26C18 15 7 14 5 21c-2 8 8 15 24 15Z" />
      <path d="M35 26c11-11 22-12 24-5 2 8-8 15-24 15Z" />
    </g>
    <g stroke="#99b3c4" strokeWidth=".8" opacity=".85">
      <path d="M27 29 9 21 M37 29 55 21 M27 33 16 40 M37 33 48 40" />
    </g>
    <path d="M26 32c-7 8-5 22 6 27 11-5 13-19 6-27Z" fill="#c9743d" stroke="#edba79" strokeWidth="1.2" />
    <path d="M23 40c6 3 12 3 18 0 M23 46c6 3 12 3 18 0 M26 52c4 2 8 2 12 0" stroke="#6f3e2b" strokeWidth="2" />
    <path d="M27 55c3 1 7 1 10 0l-5 4Z" fill="#4a3028" />
    <path d="M27 19 32 17l5 2 3 5 1 5-2 5-4 3h-6l-4-3-2-5 1-5Z" fill="#975b38" stroke="#d9a76d" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M27 23 26 26 M31 21v5 M35 22l1 4 M28 30l-1 3 M34 30l1 3" stroke="#e8a164" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M29 11 26 5 21 3 M35 11 38 5 43 3" stroke="#ba956d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="32" cy="13.5" rx="6.7" ry="6.5" fill="#30312c" stroke="#d5a474" strokeWidth="1.2" />
    <ellipse cx="27" cy="13.5" rx="1.6" ry="3.5" fill="#101820" />
    <ellipse cx="37" cy="13.5" rx="1.6" ry="3.5" fill="#101820" />
    <path d="M30 9h4" stroke="#d5a474" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);
