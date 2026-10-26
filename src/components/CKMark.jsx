 
import { useId } from 'react';
/* A small inline SVG of the CK mark.
   Accepts a `variant` prop: 'gradient' (default) or 'solid' */
export default function CKMark({ size = 32, variant = 'gradient' }) {
  const gradientId = `ckg-${useId()}`;
  const strokeValue = variant === 'gradient' ? `url(#${gradientId})` : 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2ba8d4" />
            <stop offset="55%" stopColor="#1e5f9c" />
            <stop offset="100%" stopColor="#0f2e4a" />
          </linearGradient>
        </defs>
      )}
      {/* C */}
      <path
        d="M 41 20 A 27 27 0 1 0 41 80"
        fill="none"
        stroke={strokeValue}
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* K stem */}
      <rect x="59" y="17" width="9" height="66" rx="4" fill={strokeValue} />
      {/* K arms */}
      <path d="M 68 50 L 89 17" stroke={strokeValue} strokeWidth="9" strokeLinecap="round" />
      <path d="M 68 50 L 89 83" stroke={strokeValue} strokeWidth="9" strokeLinecap="round" />
      {/* Gold plate stroke */}
      <path
        d="M 16 92 Q 50 86 84 92"
        fill="none"
        stroke="#d4952b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


