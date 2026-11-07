interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** ThusStride mark: two forward chevrons - the stride - on a dark tile. */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#0A0A0A" />
      <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#CCFF00" strokeOpacity=".25" strokeWidth="2" />
      <path d="M17 44 29 32 17 20" fill="none" stroke="#CCFF00" strokeOpacity=".45" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 44 45 32 33 20" fill="none" stroke="#CCFF00" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 32, showText = true, className = '' }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="font-display font-bold tracking-tight text-[1.2em] leading-none text-white">
          Thus<span className="text-lime">Stride</span>
        </span>
      )}
    </span>
  );
}
