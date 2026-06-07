export function RecolectaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Abstract Map Marker & Truck Logo */}
      <div className="relative w-8 h-8 flex items-center justify-center bg-[var(--rc-blue-600)] rounded-full shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
        {/* Subtle decorative arrows */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--rc-green-500)] rounded-full flex items-center justify-center border-2 border-white">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[17px] leading-tight font-bold text-[var(--rc-blue-900)] tracking-tight">
          Recolec<span className="text-[var(--rc-green-600)]">TA</span> Celaya
        </span>
        <span className="text-[9px] leading-none text-[var(--rc-slate-500)] tracking-wide uppercase">
          Sistema de trazabilidad
        </span>
      </div>
    </div>
  );
}

export function GobiernoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Abstract Dove/Flame Logo */}
      <svg width="40" height="28" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20 C20 10, 30 10, 40 20 C45 25, 50 20, 50 15 C50 5, 40 0, 30 0 C20 0, 5 15, 0 30 C5 35, 10 30, 10 20 Z" fill="var(--rc-wine-600)"/>
        <path d="M20 30 C30 25, 40 25, 50 30 C55 35, 50 40, 40 40 C30 40, 20 35, 10 35 C15 35, 20 35, 20 30 Z" fill="var(--rc-amber-500)"/>
        {/* Small olive branch representation */}
        <path d="M5 10 L15 20 M5 15 L10 10 M10 20 L15 15" stroke="var(--rc-green-600)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="flex flex-col items-center mt-1">
        <span className="text-[7px] leading-none text-[var(--rc-slate-600)] font-bold tracking-widest uppercase">
          GOBIERNO 2024-2027
        </span>
        <span className="text-[14px] leading-none font-black text-[var(--rc-wine-600)] tracking-tighter">
          Celaya
        </span>
        <span className="text-[9px] leading-none font-medium text-[var(--rc-amber-500)] italic mt-0.5">
          es la esperanza
        </span>
      </div>
    </div>
  );
}
