/** The hanging lamp from the original journal. `niche` dims until the day is lit; `welcome` always glows. */
export function Lamp({ variant }: { variant: 'niche' | 'welcome' }) {
  const glowId = variant === 'niche' ? 'glowNiche' : 'glowWelcome';
  return (
    <svg viewBox="0 0 64 92">
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE3A6" stopOpacity={variant === 'niche' ? 0.5 : 0.55} />
          <stop offset={variant === 'niche' ? '55%' : '60%'} stopColor="#FFD98A" stopOpacity={variant === 'niche' ? 0.14 : 0.12} />
          <stop offset="100%" stopColor="#FFD98A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="halo" cx="32" cy="54" r="30" fill={`url(#${glowId})`} />
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 0v19" />
        <circle cx="32" cy="22" r="2.6" />
        <path d="M23 30h18l3 6H20z" />
        <path
          className={variant === 'niche' ? 'body-fill' : undefined}
          d="M24 36h16c5 4 8 10 8 17 0 12-8 21-16 25-8-4-16-13-16-25 0-7 3-13 8-17z"
          fill={variant === 'welcome' ? 'rgba(255,240,205,.05)' : undefined}
        />
        <path d="M26 78h12l2 5H24z" />
      </g>
      <circle className="flame" cx="32" cy="55" r="4.4" fill={variant === 'welcome' ? '#FFD98A' : undefined} />
      <circle
        cx="32"
        cy="55"
        r="1.7"
        fill={variant === 'niche' ? '#0C231E' : '#FBF7EC'}
        opacity={variant === 'niche' ? 0.35 : 0.55}
      />
    </svg>
  );
}
