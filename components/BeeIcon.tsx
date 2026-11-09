import React from 'react';

interface Props { size?: number; className?: string }

/** A dorsal, simplified buff-tailed bumblebee worker (Bombus terrestris). */
export const BeeIcon: React.FC<Props> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    {/* Three pairs of jointed legs, attached to the thorax. */}
    <g stroke="#d5b575" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M25 26 18 21 14 12 M39 26 46 21 50 12" />
      <path d="M23 31 14 39 4 42 M41 31 50 39 60 42" />
      <path d="M25 35 17 44 16 54 M39 35 47 44 48 54" />
    </g>
    {/* Each bee has a forewing and a smaller hindwing on either side. */}
    <g fill="#dceaf2" fillOpacity=".82" stroke="#93b3c8" strokeWidth="1.2">
      <path d="M28 29C21 25 9 27 8 36c-1 8 9 12 22 3Z" />
      <path d="M36 29c7-4 19-2 20 7 1 8-9 12-22 3Z" />
      <path d="M29 28C20 13 8 10 4 17c-4 9 6 20 25 20Z" />
      <path d="M35 28c9-15 21-18 25-11 4 9-6 20-25 20Z" />
    </g>
    <g stroke="#93b3c8" strokeWidth=".8" opacity=".8">
      <path d="M27 31 8 18 M37 31 56 18 M26 34 12 35 M38 34 52 35" />
    </g>
    {/* Workers have a white tail with a narrow brownish fringe. */}
    <path d="M23 34C18 44 21 58 32 60c11-2 14-16 9-26Z" fill="#22262b" stroke="#ab9671" strokeWidth="1.4" />
    <path d="M22 38c6 3 14 3 20 0l1 7c-7 4-15 4-22 0Z" fill="#edbc4f" />
    <path d="M23 52c6 2 12 2 18 0-2 5-5 7-9 8-4-1-7-3-9-8Z" fill="#faf8ef" stroke="#b49772" strokeWidth=".8" />
    <path d="M23 49c6 2 12 2 18 0" stroke="#4b4437" strokeWidth="1.1" />
    {/* Soft outline and collar suggest a dense coat, rather than a wasp waist. */}
    <path d="M24 20 27 18l5 1 5-1 3 2 2 4 1 5-2 5-4 4-5 1-5-1-4-4-2-5 1-5Z" fill="#272b2e" stroke="#8c7c5a" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M23 23c5-5 13-5 18 0l1 5c-6-4-14-4-20 0Z" fill="#edbc4f" />
    <path d="M26 31 25 34 M30 32 29 36 M34 32 35 36 M38 31 39 34" stroke="#645c46" strokeWidth="1" strokeLinecap="round" />
    <path d="M28 12 26 6 21 3 M36 12 38 6 43 3" stroke="#d5b575" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="32" cy="14" rx="7" ry="6.5" fill="#252b30" stroke="#a7946e" strokeWidth="1.2" />
    <ellipse cx="26.5" cy="14" rx="1.7" ry="3.3" fill="#080f18" />
    <ellipse cx="37.5" cy="14" rx="1.7" ry="3.3" fill="#080f18" />
  </svg>
);
