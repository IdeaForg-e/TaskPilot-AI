export default function Logo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <linearGradient id="logo-delta-grad" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F0FF"/>
          <stop offset="45%" stopColor="#00A3FF"/>
          <stop offset="100%" stopColor="#0052FF"/>
        </linearGradient>

        <linearGradient id="logo-wing-dark" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A"/>
          <stop offset="100%" stopColor="#020617"/>
        </linearGradient>

        <linearGradient id="logo-core-glow" x1="50" y1="36" x2="50" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F7FF"/>
          <stop offset="50%" stopColor="#00D2FF"/>
          <stop offset="100%" stopColor="#0077FE"/>
        </linearGradient>
      </defs>

      {/* Outer Delta Stealth Body */}
      <path
        d="M 50 10 L 86 68 L 72 82 L 50 68 L 28 82 L 14 68 Z"
        fill="url(#logo-wing-dark)"
        stroke="url(#logo-delta-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter="url(#logo-glow)"
      />

      {/* Inner Wing Facets */}
      <path
        d="M 50 16 L 78 64 L 68 73 L 50 62 L 32 73 L 22 64 Z"
        fill="none"
        stroke="#00D2FF"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeDasharray="3 2"
      />

      {/* Vertical Keel Spine */}
      <line x1="50" y1="12" x2="50" y2="40" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="60" x2="50" y2="68" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round"/>

      {/* Swept Neural Traces */}
      <path d="M 50 32 L 28 50 L 22 64" fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 50 32 L 72 50 L 78 64" fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 50 42 L 36 56 L 32 72" fill="none" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 50 42 L 64 56 L 68 72" fill="none" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Telemetry Circuit Nodes */}
      <circle cx="28" cy="50" r="2.2" fill="#E0F7FF" filter="url(#logo-glow)"/>
      <circle cx="72" cy="50" r="2.2" fill="#E0F7FF" filter="url(#logo-glow)"/>
      <circle cx="36" cy="56" r="1.8" fill="#00F0FF"/>
      <circle cx="64" cy="56" r="1.8" fill="#00F0FF"/>
      <circle cx="50" cy="20" r="2" fill="#E0F7FF"/>

      {/* Cybernetic Hexagon Core */}
      <polygon
        points="50,42 58,46.5 58,55.5 50,60 42,55.5 42,46.5"
        fill="url(#logo-core-glow)"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        filter="url(#logo-glow)"
      />

      <circle cx="50" cy="51" r="2.5" fill="#FFFFFF"/>
    </svg>
  );
}
