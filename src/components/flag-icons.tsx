export function TanzaniaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      width="20"
      height="14"
      aria-hidden="true"
      className={className ?? "shrink-0 rounded-[2px]"}
    >
      <polygon points="0,0 30,0 0,20" fill="#1EB53A" />
      <polygon points="30,0 30,20 0,20" fill="#00A3DD" />
      <line x1="0" y1="20" x2="30" y2="0" stroke="#FCD116" strokeWidth="6.5" />
      <line x1="0" y1="20" x2="30" y2="0" stroke="#000000" strokeWidth="3.5" />
    </svg>
  );
}

export function UkFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      width="20"
      height="14"
      aria-hidden="true"
      className={className ?? "shrink-0 rounded-[2px]"}
    >
      <rect width="60" height="30" fill="#00247D" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#CF142B" strokeWidth="6" />
    </svg>
  );
}
