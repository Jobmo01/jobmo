export function CareersIllustration() {
  return (
    <svg
      viewBox="0 0 640 360"
      className="h-auto w-full"
      role="img"
      aria-label="Abstract illustration of connected team members, representing JobMo's future team"
    >
      <defs>
        <linearGradient id="careersGradA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <linearGradient id="careersGradB" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>

      {/* Soft background field */}
      <rect x="0" y="0" width="640" height="360" fill="hsl(var(--secondary))" rx="24" />

      {/* Connection lines — a growing network */}
      <g stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="1.5">
        <line x1="320" y1="180" x2="180" y2="100" />
        <line x1="320" y1="180" x2="460" y2="100" />
        <line x1="320" y1="180" x2="180" y2="260" />
        <line x1="320" y1="180" x2="460" y2="260" />
        <line x1="320" y1="180" x2="320" y2="70" />
        <line x1="180" y1="100" x2="90" y2="140" />
        <line x1="460" y1="100" x2="550" y2="140" />
      </g>

      {/* Central faceted hexagon — largest, brand gradient */}
      <polygon
        points="320,120 380,150 380,210 320,240 260,210 260,150"
        fill="url(#careersGradA)"
      />

      {/* Surrounding smaller faceted nodes — the growing team */}
      <polygon points="180,75 210,90 210,120 180,135 150,120 150,90" fill="hsl(var(--accent))" fillOpacity="0.85" />
      <polygon points="460,75 490,90 490,120 460,135 430,120 430,90" fill="url(#careersGradB)" fillOpacity="0.85" />
      <polygon points="180,235 210,250 210,280 180,295 150,280 150,250" fill="hsl(var(--primary))" fillOpacity="0.7" />
      <polygon points="460,235 490,250 490,280 460,295 430,280 430,250" fill="hsl(var(--accent))" fillOpacity="0.6" />
      <polygon points="320,45 345,58 345,84 320,97 295,84 295,58" fill="hsl(var(--primary))" fillOpacity="0.5" />

      {/* Small satellite dots — hints of future team members */}
      <circle cx="90" cy="140" r="6" fill="hsl(var(--accent))" />
      <circle cx="550" cy="140" r="6" fill="hsl(var(--primary))" />
      <circle cx="320" cy="300" r="6" fill="hsl(var(--accent))" fillOpacity="0.7" />
    </svg>
  );
}
