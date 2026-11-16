/**
 * A leaded stained-glass window that fills the gallery's doorway arch: a rose at the head,
 * diamond quarries below. Drawn in the same 720-wide coordinates as <Arch>, so the two line up.
 * It is meant to be seen dimly, as light coming through from beyond the entrance.
 */

const RUBY = "#9b1b30";
const COBALT = "#1f3d8f";
const AMBER = "#d39a2b";
const EMERALD = "#2d6e4b";
const VIOLET = "#5c2b70";
const PALE = "#ead7a4";

const QUARRY_COLOURS = [COBALT, PALE, RUBY, PALE, AMBER, COBALT, PALE, EMERALD, PALE, VIOLET];

export function StainedGlass({ tall = false, className = "" }: { tall?: boolean; className?: string }) {
  const H = tall ? 1420 : 1000;
  const id = tall ? "t" : "w";
  const cx = 360;
  const cy = 360;

  // Rose window: an outer ring of 16 petals, an inner ring of 8, a centre boss.
  const ring = (n: number, r0: number, r1: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a0 = ((i + offset) / n) * Math.PI * 2;
      const a1 = ((i + 1 + offset) / n) * Math.PI * 2;
      const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
      return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`;
    });
  const outer = ring(16, 170, 262);
  const inner = ring(8, 82, 170, 0.5);

  // Diamond quarries below the rose.
  const quarries: { d: string; fill: string }[] = [];
  const w = 76;
  const h = 104;
  for (let row = 0; row * (h / 2) + 560 < H + h; row++) {
    for (let col = -1; col * w < 720 + w; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0);
      const y = 560 + row * (h / 2);
      const d = `M${x} ${y - h / 2}L${x + w / 2} ${y}L${x} ${y + h / 2}L${x - w / 2} ${y}Z`;
      quarries.push({ d, fill: QUARRY_COLOURS[(row * 3 + col * 7 + 20) % QUARRY_COLOURS.length]! });
    }
  }

  const archPath = `M58 ${H}V400a302 302 0 0 1 604 0V${H}Z`;

  return (
    <svg viewBox={`0 0 720 ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden className={className}>
      <defs>
        <clipPath id={`glass-clip-${id}`}>
          <path d={archPath} />
        </clipPath>
        <radialGradient id={`glass-light-${id}`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff1cc" />
          <stop offset="0.45" stopColor="#e9c98a" />
          <stop offset="1" stopColor="#6b4a2a" />
        </radialGradient>
        <filter id={`glass-bloom-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <g clipPath={`url(#glass-clip-${id})`}>
        {/* daylight behind the glass */}
        <rect width="720" height={H} fill={`url(#glass-light-${id})`} />

        {/* coloured glass, plus a blurred copy for the glow it throws */}
        {[true, false].map((bloom) => (
          <g key={String(bloom)} filter={bloom ? `url(#glass-bloom-${id})` : undefined} opacity={bloom ? 0.9 : 0.78}>
            {quarries.map((q, i) => (
              <path key={`q${i}`} d={q.d} fill={q.fill} />
            ))}
            <circle cx={cx} cy={cy} r={300} fill={COBALT} />
            {outer.map((d, i) => (
              <path key={`o${i}`} d={d} fill={i % 2 ? RUBY : AMBER} />
            ))}
            {inner.map((d, i) => (
              <path key={`i${i}`} d={d} fill={i % 2 ? EMERALD : VIOLET} />
            ))}
            <circle cx={cx} cy={cy} r={82} fill={PALE} />
            <circle cx={cx} cy={cy} r={38} fill={RUBY} />
          </g>
        ))}

        {/* lead cames */}
        <g fill="none" stroke="#1b120b" strokeLinejoin="round">
          {quarries.map((q, i) => (
            <path key={`ql${i}`} d={q.d} strokeWidth="3.5" />
          ))}
          <rect x="40" y="548" width="640" height="7" fill="#1b120b" />
          {outer.map((d, i) => (
            <path key={`ol${i}`} d={d} strokeWidth="4" />
          ))}
          {inner.map((d, i) => (
            <path key={`il${i}`} d={d} strokeWidth="4" />
          ))}
          <circle cx={cx} cy={cy} r={82} strokeWidth="5" />
          <circle cx={cx} cy={cy} r={38} strokeWidth="4" />
          <circle cx={cx} cy={cy} r={262} strokeWidth="7" />
        </g>
      </g>
    </svg>
  );
}
