import React from 'react';

interface Props { size?: number; className?: string }

/** Female marmalade hoverfly: one wing pair, short antennae and paired dark bands. */
export const FlyIcon: React.FC<Props> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g stroke="#d7ad65" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M27 23 19 20 15 13 M37 23 45 20 49 13" />
      <path d="M27 28 18 30 9 27 M37 28 46 30 55 27" />
      <path d="M28 32 19 39 16 50 M36 32 45 39 48 50" />
    </g>
    {/* Diptera have just one functional pair of wings. */}
    <g fill="#e7f1f7" fillOpacity=".85" stroke="#9cb7cb" strokeWidth="1.2">
      <path d="M29 25C17 23 3 31 5 40c2 8 14 4 24-6Z" />
      <path d="M35 25c12-2 26 6 24 15-2 8-14 4-24-6Z" />
    </g>
    <g stroke="#96b1c6" strokeWidth=".85" opacity=".85">
      <path d="M27 28 9 38 M37 28 55 38 M21 31 19 38 12 40 M43 31 45 38 52 40" />
    </g>
    {/* Tapered abdomen with the marmalade hoverfly's double black markings. */}
    <path d="M26 32c-2 8-2 20 6 28 8-8 8-20 6-28Z" fill="#e8a744" stroke="#a38855" strokeWidth="1.2" />
    <path d="M26 34h12l1 4H25Z M25 42h14v2H25Z M25 46h14l-1 4H26Z M27 53h10l-1 2h-8Z" fill="#25312f" />
    <path d="M29 57h6l-3 3Z" fill="#25312f" />
    <ellipse cx="32" cy="26" rx="7.5" ry="10" fill="#38453b" stroke="#b1a56a" strokeWidth="1.2" />
    <path d="M29 19v11 M35 19v11" stroke="#9d985d" strokeWidth="1.2" />
    <path d="M28 33c2 3 6 3 8 0" stroke="#e5c366" strokeWidth="2.7" strokeLinecap="round" />
    {/* Female eyes are separated by the frons. */}
    <ellipse cx="32" cy="12.5" rx="9" ry="7" fill="#c9b978" stroke="#d7ca93" strokeWidth="1" />
    <ellipse cx="26.7" cy="12.5" rx="3.5" ry="6.1" fill="#8b4f35" />
    <ellipse cx="37.3" cy="12.5" rx="3.5" ry="6.1" fill="#8b4f35" />
    <path d="M30 7 29 4 M34 7 35 4" stroke="#d7ad65" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M26 8v2 M37 8v2" stroke="#d99e6f" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
