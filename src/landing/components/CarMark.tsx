/** Shared SVG car primitives — original geometric marks, no liveries, no branding. */

export function TopDownCar({ color = "#f4f1ea", accent = "#ff2e1f" }: { color?: string; accent?: string }) {
  return (
    <g>
      {/* nose */}
      <path d="M 0 -26 L 5 -8 L 5 22 L -5 22 L -5 -8 Z" fill={color} />
      {/* cockpit */}
      <ellipse cx="0" cy="-4" rx="4.5" ry="7" fill="#131210" stroke={color} strokeWidth="1.2" />
      {/* sidepods */}
      <path d="M -5 -2 L -13 4 L -13 16 L -5 14 Z" fill={color} opacity="0.85" />
      <path d="M 5 -2 L 13 4 L 13 16 L 5 14 Z" fill={color} opacity="0.85" />
      {/* front wing */}
      <rect x="-14" y="18" width="28" height="3.4" rx="1" fill={color} />
      {/* rear wing */}
      <rect x="-13" y="-24" width="26" height="3.4" rx="1" fill={accent} />
      <rect x="-11" y="-24" width="3" height="9" fill={accent} opacity="0.7" />
      <rect x="8" y="-24" width="3" height="9" fill={accent} opacity="0.7" />
      {/* wheels */}
      {[
        [-11, 14], [11, 14], [-11, -14], [11, -14],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x - 3.4} y={y - 6} width="6.8" height="12" rx="2" fill="#0d0c0b" stroke={color} strokeWidth="1" />
      ))}
      {/* halo */}
      <path d="M -5 -8 A 6 6 0 0 1 5 -8" fill="none" stroke={accent} strokeWidth="1.6" />
    </g>
  );
}

export function SideCar({ body = "#1c1b19", accent = "#ff2e1f" }: { body?: string; accent?: string }) {
  return (
    <g>
      <ellipse cx="-52" cy="1" rx="42" ry="4" fill={accent} opacity="0.3" />
      <rect x="-64" y="-28" width="4.5" height="20" fill="#2b2a26" />
      <rect x="-73" y="-31" width="15" height="4.5" rx="1" fill="#35342f" />
      <path d="M -58 -6 L -30 -8 L -12 -15 L 22 -16 L 44 -9 L 58 -7 L 56 -1 L -56 -1 Z" fill={body} stroke="rgba(244,241,234,0.3)" strokeWidth="1" />
      <path d="M -56 -3.5 L 54 -3.5" stroke={accent} strokeWidth="1.6" />
      <path d="M 44 -9 L 66 -5 L 66 -1 L 44 -1 Z" fill="#262522" />
      <rect x="60" y="-5" width="15" height="3.6" rx="1" fill="#35342f" />
      <ellipse cx="2" cy="-16" rx="9" ry="3.6" fill="#0d0c0b" stroke="rgba(244,241,234,0.35)" strokeWidth="1" />
      <path d="M -10 -15 A 13 13 0 0 1 14 -17" fill="none" stroke="#4a4842" strokeWidth="2.2" strokeLinecap="round" />
      {[-38, 40].map((cx) => (
        <g key={cx} transform={`translate(${cx} 1)`}>
          <circle r="12.5" fill="#0d0c0b" stroke="#3a3835" strokeWidth="2" />
          <path d="M -6 0 H 6 M 0 -6 V 6" stroke="#8a867c" strokeWidth="1.3" />
          <circle r="3.2" fill="#a39e93" />
        </g>
      ))}
    </g>
  );
}
