"use client";

export function WorkspaceIllustration() {
  return (
    <div className="relative w-full max-w-[440px] aspect-[4/3]">
      {/* Floating background shapes with animations */}
      <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10 animate-float-slow" />
      <div className="absolute top-20 right-4 w-10 h-10 rounded-full bg-white/15 animate-float-medium" />
      <div className="absolute bottom-12 left-4 w-12 h-12 rounded-full bg-white/8 animate-float-fast" />
      <div className="absolute bottom-28 right-16 w-8 h-8 rounded-full bg-white/12 animate-float-slow" />
      <div className="absolute top-2 right-24 w-6 h-6 rounded-lg bg-white/10 rotate-45 animate-float-medium" />

      <svg
        viewBox="0 0 440 330"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Desk / Table surface */}
        <rect x="60" y="240" width="320" height="6" rx="3" fill="white" fillOpacity="0.15" />

        {/* Monitor */}
        <rect x="140" y="100" width="160" height="110" rx="8" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
        {/* Monitor screen content - task cards */}
        <rect x="154" y="116" width="56" height="10" rx="2" fill="white" fillOpacity="0.25" />
        <rect x="154" y="132" width="40" height="6" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="154" y="144" width="48" height="6" rx="2" fill="white" fillOpacity="0.15" />
        {/* Kanban columns on screen */}
        <rect x="220" y="116" width="1" height="76" fill="white" fillOpacity="0.15" />
        <rect x="260" y="116" width="1" height="76" fill="white" fillOpacity="0.15" />
        {/* Column cards */}
        <rect x="226" y="118" width="28" height="18" rx="3" fill="white" fillOpacity="0.2" />
        <rect x="226" y="142" width="28" height="14" rx="3" fill="white" fillOpacity="0.12" />
        <rect x="266" y="118" width="28" height="22" rx="3" fill="white" fillOpacity="0.18" />
        <rect x="266" y="146" width="28" height="14" rx="3" fill="white" fillOpacity="0.1" />
        {/* Status dots on cards */}
        <circle cx="160" cy="150" r="2.5" fill="white" fillOpacity="0.4" />
        <circle cx="232" cy="124" r="2" fill="white" fillOpacity="0.5" />
        <circle cx="272" cy="126" r="2" fill="white" fillOpacity="0.35" />
        {/* Monitor stand */}
        <rect x="205" y="210" width="30" height="16" rx="2" fill="white" fillOpacity="0.12" />
        <rect x="195" y="226" width="50" height="4" rx="2" fill="white" fillOpacity="0.15" />

        {/* Laptop (left side) */}
        <rect x="30" y="195" width="80" height="50" rx="5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        {/* Laptop screen lines */}
        <rect x="40" y="206" width="30" height="4" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="40" y="215" width="50" height="3" rx="1" fill="white" fillOpacity="0.12" />
        <rect x="40" y="223" width="38" height="3" rx="1" fill="white" fillOpacity="0.12" />
        {/* Laptop base */}
        <rect x="25" y="245" width="90" height="5" rx="2.5" fill="white" fillOpacity="0.08" />

        {/* Person 1 (left - sitting at laptop) */}
        <circle cx="70" cy="165" r="14" fill="white" fillOpacity="0.2" />
        {/* Body */}
        <path d="M52 195 C52 180 88 180 88 195" fill="white" fillOpacity="0.12" />
        {/* Arm reaching to laptop */}
        <path d="M80 186 Q90 192 85 200" stroke="white" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Person 2 (center - standing, pointing at monitor) */}
        <circle cx="195" cy="60" r="16" fill="white" fillOpacity="0.22" />
        {/* Body */}
        <rect x="182" y="78" width="26" height="40" rx="8" fill="white" fillOpacity="0.14" />
        {/* Arm pointing */}
        <path d="M208 88 Q230 82 240 95" stroke="white" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Legs */}
        <path d="M190 118 L186 155" stroke="white" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
        <path d="M200 118 L204 155" stroke="white" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />

        {/* Person 3 (right side - sitting with tablet) */}
        <circle cx="370" cy="175" r="13" fill="white" fillOpacity="0.18" />
        {/* Body */}
        <path d="M354 205 C354 190 386 190 386 205" fill="white" fillOpacity="0.1" />
        {/* Tablet */}
        <rect x="345" y="200" width="30" height="40" rx="4" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Tablet lines */}
        <rect x="350" y="208" width="20" height="3" rx="1" fill="white" fillOpacity="0.15" />
        <rect x="350" y="215" width="14" height="3" rx="1" fill="white" fillOpacity="0.1" />

        {/* Chat bubble (top right) */}
        <rect x="320" y="60" width="80" height="40" rx="10" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <polygon points="340,100 345,90 355,95" fill="white" fillOpacity="0.12" />
        {/* Chat lines */}
        <rect x="332" y="72" width="40" height="4" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="332" y="82" width="30" height="4" rx="2" fill="white" fillOpacity="0.15" />

        {/* Notification / AI sparkle (top left) */}
        <g transform="translate(60, 50)">
          {/* Star shape for AI */}
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="white" fillOpacity="0.3" />
        </g>

        {/* Connecting lines (collaboration) */}
        <path d="M84 170 Q140 130 180 85" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M210 85 Q300 100 358 175" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Small task checkmarks */}
        <g transform="translate(155, 156)">
          <rect width="14" height="14" rx="3" fill="white" fillOpacity="0.15" />
          <path d="M3 7 L6 10 L11 4" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Progress bar on screen */}
        <rect x="154" y="170" width="56" height="6" rx="3" fill="white" fillOpacity="0.08" />
        <rect x="154" y="170" width="36" height="6" rx="3" fill="white" fillOpacity="0.25" />

        {/* Coffee cup (detail) */}
        <rect x="322" y="230" width="14" height="16" rx="3" fill="white" fillOpacity="0.08" />
        <path d="M336 234 Q342 236 336 242" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" fill="none" />
        {/* Steam */}
        <path d="M327 226 Q329 220 331 224" stroke="white" strokeOpacity="0.1" strokeWidth="1" fill="none" />

        {/* Scattered dots (data/particles) */}
        <circle cx="128" cy="80" r="2" fill="white" fillOpacity="0.15" />
        <circle cx="310" cy="140" r="2.5" fill="white" fillOpacity="0.12" />
        <circle cx="250" cy="60" r="1.5" fill="white" fillOpacity="0.2" />
        <circle cx="100" cy="130" r="2" fill="white" fillOpacity="0.1" />
        <circle cx="400" cy="120" r="1.5" fill="white" fillOpacity="0.15" />
      </svg>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(-12px); opacity: 1; }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          50% { transform: translateY(-8px) translateX(4px); opacity: 1; }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          50% { transform: translateY(-6px); opacity: 0.9; }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
