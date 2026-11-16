/**
 * Coloured light from a stained-glass window, falling across the top of a wall.
 * Drawn as SVG (blurred shapes under a fading mask) so it renders identically in every browser
 * and costs nothing once painted. Purely decorative.
 */
export function WindowLight({ soft = false, className = "" }: { soft?: boolean; className?: string }) {
  const id = soft ? "s" : "d";
  const o = soft ? 0.5 : 1;
  return (
    <svg
      aria-hidden
      className={`window-light ${soft ? "window-light-soft" : ""} ${className}`}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`wl-fade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`wl-mask-${id}`} maskContentUnits="userSpaceOnUse">
          <rect width="1000" height="1000" fill={`url(#wl-fade-${id})`} />
        </mask>
        <linearGradient id={`wl-glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9b1b30" />
          <stop offset="0.25" stopColor="#d39a2b" />
          <stop offset="0.5" stopColor="#2d6e4b" />
          <stop offset="0.75" stopColor="#1f3d8f" />
          <stop offset="1" stopColor="#5c2b70" />
        </linearGradient>
        <filter id={`wl-blur-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <g mask={`url(#wl-mask-${id})`} filter={`url(#wl-blur-${id})`}>
        {/* the shaft of light from a window high on the left */}
        <polygon points="150,-40 430,-40 760,1040 470,1040" fill={`url(#wl-glass-${id})`} opacity={0.2 * o} />
        {/* pools where light catches the top of the wall */}
        <ellipse cx="200" cy="40" rx="190" ry="120" fill="#9b1b30" opacity={0.22 * o} />
        <ellipse cx="800" cy="70" rx="200" ry="130" fill="#1f3d8f" opacity={0.26 * o} />
        <ellipse cx="520" cy="0" rx="260" ry="110" fill="#ffe2aa" opacity={0.12 * o} />
      </g>
    </svg>
  );
}
