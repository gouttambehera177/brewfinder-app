export function BrewLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="BrewNear logo">
      <path
        d="M24 3c-8.3 0-15 6.5-15 14.6 0 10.3 12.4 24.1 14 25.8a1.4 1.4 0 0 0 2 0c1.6-1.7 14-15.5 14-25.8C39 9.5 32.3 3 24 3Z"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M16 13h13v7.5A6.5 6.5 0 0 1 22.5 27h0A6.5 6.5 0 0 1 16 20.5V13Z"
        fill="currentColor"
        className="text-background"
      />
      <path
        d="M29 15.5h2.2a3.3 3.3 0 0 1 0 6.6H29"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-background"
      />
      <path
        d="M14.5 30.5h16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="text-background"
      />
    </svg>
  );
}
