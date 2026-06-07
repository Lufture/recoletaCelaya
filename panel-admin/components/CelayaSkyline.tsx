interface CelayaSkylineProps {
  className?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * Celaya city skyline illustration:
 * Parroquia dome · Jardín kiosko · tree · clock tower · garbage truck
 * Matches the brand illustration in the Recolecta Celaya design system.
 */
export function CelayaSkyline({
  className = '',
  color = '#162244',
  strokeWidth = 1.6,
}: CelayaSkylineProps) {
  const sw = strokeWidth;
  const cols = [234, 255, 276, 297, 318, 339, 360, 379];

  return (
    <svg
      viewBox="0 0 860 185"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Silueta de Celaya con camión recolector"
      role="img"
    >
      <g
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ── Ground line ── */}
        <line x1="0" y1="178" x2="860" y2="178" />

        {/* ══════════════════════════════════════════
            PARROQUIA INMACULADA CONCEPCIÓN
        ══════════════════════════════════════════ */}
        {/* Side buttresses */}
        <path d="M 10,178 L 10,118 L 25,118" />
        <path d="M 190,178 L 190,118 L 175,118" />
        {/* Main nave */}
        <path d="M 25,178 L 25,108 L 175,108 L 175,178" />
        {/* Left arched window */}
        <path d="M 40,150 L 40,130 A 11,11 0 0,0 62,130 L 62,150" />
        {/* Right arched window */}
        <path d="M 128,150 L 128,130 A 11,11 0 0,0 150,130 L 150,150" />
        {/* Main entrance arch */}
        <path d="M 83,178 L 83,156 A 17,17 0 0,0 117,156 L 117,178" />
        {/* Dome drum */}
        <path d="M 55,108 L 55,78 L 145,78 L 145,108" />
        {/* Dome (half-ellipse) */}
        <path d="M 55,78 A 45,60 0 0,0 145,78" />
        {/* Cross */}
        <line x1="100" y1="18" x2="100" y2="3" />
        <line x1="91" y1="10" x2="109" y2="10" />

        {/* ══════════════════════════════════════════
            JARDÍN PRINCIPAL — KIOSKO
        ══════════════════════════════════════════ */}
        {/* Steps (3 levels) */}
        <rect x="210" y="171" width="185" height="7" />
        <rect x="218" y="163" width="169" height="8" />
        <rect x="226" y="155" width="153" height="8" />
        {/* Columns */}
        {cols.map((x) => (
          <line key={x} x1={x} y1="155" x2={x} y2="108" />
        ))}
        {/* Entablature beam */}
        <line x1="226" y1="108" x2="381" y2="108" />
        {/* Outer roof */}
        <path d="M 210,108 L 303,55 L 396,108" />
        {/* Inner roof rafter detail */}
        <path d="M 226,108 L 303,63 L 380,108" strokeOpacity="0.45" strokeWidth={sw * 0.8} />
        {/* Flagpole */}
        <line x1="303" y1="55" x2="303" y2="26" />
        {/* Flag */}
        <path d="M 303,26 L 303,42 L 326,34 Z" />
        {/* Finial ball */}
        <circle cx="303" cy="24" r="4" />

        {/* ══════════════════════════════════════════
            ÁRBOL
        ══════════════════════════════════════════ */}
        {/* Trunk */}
        <line x1="450" y1="178" x2="450" y2="150" strokeWidth={sw * 1.3} />
        {/* Crown */}
        <path d="M 428,164 Q 427,136 450,132 Q 473,136 472,164 Q 461,175 450,173 Q 439,175 428,164 Z" />

        {/* ══════════════════════════════════════════
            TORRE DEL RELOJ (TEMPLO DEL CARMEN)
        ══════════════════════════════════════════ */}
        {/* Tower body */}
        <path d="M 510,178 L 510,18 L 565,18 L 565,178" />
        {/* Cornice band */}
        <rect x="503" y="50" width="79" height="7" />
        {/* Window pair — lower */}
        <path d="M 518,170 L 518,150 A 9,9 0 0,0 536,150 L 536,170" />
        <path d="M 539,170 L 539,150 A 9,9 0 0,0 557,150 L 557,170" />
        {/* Window pair — middle */}
        <path d="M 518,130 L 518,110 A 9,9 0 0,0 536,110 L 536,130" />
        <path d="M 539,130 L 539,110 A 9,9 0 0,0 557,110 L 557,130" />
        {/* Window pair — upper */}
        <path d="M 518,90 L 518,70 A 9,9 0 0,0 536,70 L 536,90" />
        <path d="M 539,90 L 539,70 A 9,9 0 0,0 557,70 L 557,90" />
        {/* Spire */}
        <line x1="537" y1="18" x2="537" y2="3" />
        <line x1="529" y1="10" x2="545" y2="10" />

        {/* ══════════════════════════════════════════
            CAMIÓN RECOLECTOR
        ══════════════════════════════════════════ */}
        {/* Cargo body */}
        <path d="M 590,165 L 590,98 L 768,98 L 768,165" />
        {/* Horizontal panel split */}
        <line x1="590" y1="120" x2="768" y2="120" />
        {/* Body windows / panels */}
        <rect x="612" y="103" width="27" height="17" rx="2" />
        <rect x="656" y="103" width="27" height="17" rx="2" />
        <rect x="700" y="103" width="27" height="17" rx="2" />
        {/* Cab */}
        <path d="M 768,165 L 768,108 L 806,98 L 845,118 L 845,165" />
        {/* Windshield frame */}
        <path d="M 772,108 L 772,122 L 841,122" />
        {/* Cab window glass */}
        <path d="M 776,110 L 776,120 L 835,120 L 806,100 Z" strokeOpacity="0.5" />
        {/* Rear dual wheels */}
        <circle cx="632" cy="174" r="13" />
        <circle cx="632" cy="174" r="5" />
        <circle cx="670" cy="174" r="13" />
        <circle cx="670" cy="174" r="5" />
        {/* Front wheel */}
        <circle cx="802" cy="174" r="13" />
        <circle cx="802" cy="174" r="5" />
        {/* Exhaust pipe */}
        <path d="M 822,98 C 838,90 843,75 839,62" strokeWidth={sw * 1.5} />
        {/* Exhaust puff */}
        <circle cx="839" cy="57" r="4" strokeOpacity="0.4" />
        <circle cx="845" cy="50" r="3" strokeOpacity="0.25" />
        {/* Front bumper step */}
        <path d="M 845,148 L 858,148 L 858,158 L 845,158" />
        {/* Rear step board */}
        <path d="M 590,152 L 575,152 L 575,165 L 590,165" />
      </g>
    </svg>
  );
}
