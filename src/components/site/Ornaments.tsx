/** Small engraved ornaments. Kept few and fine: they mark transitions, they don't decorate. */

export function Lozenge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" width="120" height="12" aria-hidden className={`block ${className}`} fill="none" stroke="currentColor">
      <path d="M0 6h48M72 6h48" strokeWidth="0.75" />
      <path d="M60 1.5 64.5 6 60 10.5 55.5 6Z" strokeWidth="0.9" />
      <circle cx="51" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="69" cy="6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The gallery's doorway: a round-headed arch drawn as a double moulding with a keystone.
 * `tall` lengthens the jambs for narrow screens so the arch still frames the name.
 */
export function Arch({ className = "", tall = false, hollow = false }: { className?: string; tall?: boolean; hollow?: boolean }) {
  const o = tall ? 420 : 0;
  const H = 1000 + o;
  const spring = 400;
  const id = tall ? "t" : "w";
  return (
    <svg viewBox={`0 0 720 ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden className={className} fill="none">
      <defs>
        <linearGradient id={`arch-gilt-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3d2a6" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#a8864b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a8864b" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`arch-room-${id}`} cx="0.5" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#6b4a32" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#4c3627" stopOpacity="0.25" />
          <stop offset="1" stopColor="#33241a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the lit room beyond the doorway */}
      {hollow ? null : <path d={`M40 ${H}V${spring}a320 320 0 0 1 640 0V${H}Z`} fill={`url(#arch-room-${id})`} />}
      {/* outer and inner mouldings */}
      <path d={`M40 ${H}V${spring}a320 320 0 0 1 640 0V${H}`} stroke={`url(#arch-gilt-${id})`} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      <path d={`M58 ${H}V${spring}a302 302 0 0 1 604 0V${H}`} stroke={`url(#arch-gilt-${id})`} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      {/* impost blocks where the arch springs */}
      <path d={`M28 ${spring}h42M650 ${spring}h42`} stroke={`url(#arch-gilt-${id})`} strokeWidth="1" />
      <path d={`M28 ${spring + 8}h42M650 ${spring + 8}h42`} stroke={`url(#arch-gilt-${id})`} strokeWidth="0.5" />
      {/* keystone */}
      <path d="M347 70h26l-4 30h-18Z" fill="#33241a" stroke="#cdb27c" strokeOpacity="0.8" strokeWidth="0.9" />
    </svg>
  );
}
