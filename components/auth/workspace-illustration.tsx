"use client";

export function WorkspaceIllustration() {
  return (
    <div className="relative w-full max-w-[480px]">
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes dash-move {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        .float-1 { animation: float1 4s ease-in-out infinite; }
        .float-2 { animation: float2 5s ease-in-out infinite 0.5s; }
        .float-3 { animation: float3 6s ease-in-out infinite 1s; }
        .pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
        .dash-anim { animation: dash-move 2s linear infinite; }
      `}</style>
      <svg
        viewBox="0 0 500 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Floor / ground shadow */}
        <ellipse cx="250" cy="370" rx="180" ry="12" fill="#E8E4F0" fillOpacity="0.5" />

        {/* === DESK === */}
        {/* Desk top */}
        <rect x="100" y="280" width="280" height="12" rx="4" fill="#D4C8E8" />
        {/* Desk legs */}
        <rect x="130" y="292" width="8" height="60" rx="3" fill="#C4B5D6" />
        <rect x="342" y="292" width="8" height="60" rx="3" fill="#C4B5D6" />
        {/* Desk crossbar */}
        <rect x="130" y="330" width="220" height="4" rx="2" fill="#D4C8E8" fillOpacity="0.6" />

        {/* === LAPTOP === */}
        {/* Laptop base */}
        <rect x="175" y="260" width="130" height="20" rx="3" fill="#6B7280" />
        <rect x="178" y="262" width="124" height="14" rx="2" fill="#9CA3AF" fillOpacity="0.3" />
        {/* Laptop screen */}
        <rect x="185" y="195" width="110" height="68" rx="4" fill="#374151" />
        <rect x="189" y="199" width="102" height="56" rx="2" fill="#1E1B4B" />
        {/* Screen content - mini kanban */}
        <rect x="193" y="204" width="28" height="6" rx="2" fill="#7C3AED" fillOpacity="0.8" />
        <rect x="225" y="204" width="28" height="6" rx="2" fill="#3B82F6" fillOpacity="0.8" />
        <rect x="257" y="204" width="28" height="6" rx="2" fill="#10B981" fillOpacity="0.8" />
        {/* Mini cards in columns */}
        <rect x="193" y="214" width="28" height="10" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="193" y="228" width="28" height="10" rx="2" fill="white" fillOpacity="0.12" />
        <rect x="225" y="214" width="28" height="14" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="257" y="214" width="28" height="8" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="257" y="226" width="28" height="8" rx="2" fill="white" fillOpacity="0.12" />
        {/* Progress bar on screen */}
        <rect x="193" y="244" width="94" height="4" rx="2" fill="white" fillOpacity="0.1" />
        <rect x="193" y="244" width="58" height="4" rx="2" fill="#7C3AED" fillOpacity="0.6" />
        {/* Laptop hinge */}
        <rect x="225" y="263" width="30" height="3" rx="1.5" fill="#4B5563" />

        {/* === PERSON === */}
        {/* Chair back */}
        <rect x="210" y="270" width="60" height="55" rx="10" fill="#7C3AED" fillOpacity="0.15" />
        {/* Chair seat */}
        <ellipse cx="240" cy="320" rx="35" ry="8" fill="#7C3AED" fillOpacity="0.12" />
        {/* Chair wheels */}
        <circle cx="220" cy="352" r="4" fill="#9CA3AF" fillOpacity="0.5" />
        <circle cx="260" cy="352" r="4" fill="#9CA3AF" fillOpacity="0.5" />
        <rect x="237" y="328" width="6" height="20" rx="3" fill="#9CA3AF" fillOpacity="0.4" />

        {/* Body / torso */}
        <path d="M220 290 Q240 275 260 290 L256 320 Q240 325 224 320 Z" fill="#7C3AED" />
        {/* Collar detail */}
        <path d="M232 288 L240 295 L248 288" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.3" />

        {/* Head */}
        <circle cx="240" cy="268" r="18" fill="#FBBF7B" />
        {/* Hair */}
        <path d="M222 262 Q222 248 240 248 Q258 248 258 262 Q255 254 240 254 Q225 254 222 262Z" fill="#4A3728" />
        {/* Hair side detail */}
        <path d="M222 262 Q220 268 222 274" stroke="#4A3728" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M258 262 Q260 268 258 274" stroke="#4A3728" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        <circle cx="233" cy="268" r="2" fill="#374151" />
        <circle cx="247" cy="268" r="2" fill="#374151" />
        {/* Smile */}
        <path d="M234 275 Q240 280 246 275" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Glasses */}
        <circle cx="233" cy="268" r="6" stroke="#6B7280" strokeWidth="1.2" fill="none" />
        <circle cx="247" cy="268" r="6" stroke="#6B7280" strokeWidth="1.2" fill="none" />
        <line x1="239" y1="268" x2="241" y2="268" stroke="#6B7280" strokeWidth="1.2" />

        {/* Left arm reaching toward laptop */}
        <path d="M222 295 Q205 300 200 275 Q198 265 205 260" stroke="#FBBF7B" strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* Left hand */}
        <circle cx="205" cy="258" r="5" fill="#FBBF7B" />

        {/* Right arm on desk / mouse */}
        <path d="M258 295 Q275 300 285 280 Q288 275 290 270" stroke="#FBBF7B" strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* Right hand */}
        <circle cx="290" cy="268" r="5" fill="#FBBF7B" />

        {/* Mouse on desk */}
        <rect x="285" y="268" width="16" height="10" rx="5" fill="#9CA3AF" />
        <line x1="293" y1="269" x2="293" y2="273" stroke="#6B7280" strokeWidth="1" />

        {/* Coffee cup on desk */}
        <rect x="330" y="258" width="18" height="22" rx="3" fill="white" stroke="#D1D5DB" strokeWidth="1" />
        <path d="M348 265 Q356 265 356 272 Q356 279 348 279" stroke="#D1D5DB" strokeWidth="1" fill="none" />
        {/* Coffee steam */}
        <path d="M335 254 Q337 248 335 242" stroke="#D1D5DB" strokeWidth="1" fill="none" className="pulse-soft" />
        <path d="M341 254 Q343 246 341 240" stroke="#D1D5DB" strokeWidth="1" fill="none" className="pulse-soft" />

        {/* Plant on desk */}
        <rect x="115" y="262" width="16" height="18" rx="2" fill="#D97706" fillOpacity="0.3" />
        <path d="M123 262 Q118 248 123 238 Q125 232 130 235 Q126 240 123 250" fill="#10B981" fillOpacity="0.7" />
        <path d="M123 262 Q128 250 123 240 Q120 234 116 237 Q120 242 123 252" fill="#10B981" fillOpacity="0.5" />
        <path d="M123 262 Q133 252 128 242" stroke="#10B981" strokeWidth="2" fill="none" strokeOpacity="0.4" />

        {/* === FLOATING UI ELEMENTS === */}

        {/* Floating task card - top left */}
        <g className="float-1">
          <rect x="30" y="80" width="105" height="65" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="42" y="92" width="50" height="5" rx="2.5" fill="#7C3AED" fillOpacity="0.7" />
          <rect x="42" y="102" width="75" height="4" rx="2" fill="#D1D5DB" />
          <rect x="42" y="110" width="60" height="4" rx="2" fill="#D1D5DB" fillOpacity="0.6" />
          {/* Priority badge */}
          <rect x="42" y="120" width="32" height="14" rx="7" fill="#FF6B6B" fillOpacity="0.15" />
          <text x="48" y="130" fontSize="7" fontWeight="600" fill="#FF6B6B">High</text>
          {/* Avatar */}
          <circle cx="120" cy="128" r="8" fill="#3B82F6" fillOpacity="0.2" />
          <text x="117" y="132" fontSize="8" fontWeight="600" fill="#3B82F6">S</text>
        </g>

        {/* Floating kanban card - top right */}
        <g className="float-2">
          <rect x="370" y="60" width="110" height="80" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          {/* Mini kanban header */}
          <rect x="382" y="72" width="24" height="5" rx="2.5" fill="#7C3AED" fillOpacity="0.6" />
          <rect x="410" y="72" width="24" height="5" rx="2.5" fill="#3B82F6" fillOpacity="0.6" />
          <rect x="438" y="72" width="24" height="5" rx="2.5" fill="#10B981" fillOpacity="0.6" />
          {/* Mini cards */}
          <rect x="382" y="82" width="24" height="12" rx="3" fill="#F3F0FF" stroke="#E4E0F7" strokeWidth="0.5" />
          <rect x="382" y="98" width="24" height="12" rx="3" fill="#F3F0FF" stroke="#E4E0F7" strokeWidth="0.5" />
          <rect x="410" y="82" width="24" height="16" rx="3" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.5" />
          <rect x="438" y="82" width="24" height="10" rx="3" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.5" />
          {/* Checkmark in done */}
          <path d="M446 86 L449 89 L454 83" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Sprint label */}
          <rect x="382" y="118" width="86" height="12" rx="6" fill="#7C3AED" fillOpacity="0.08" />
          <text x="400" y="127" fontSize="7" fontWeight="500" fill="#7C3AED">Sprint 4 Active</text>
        </g>

        {/* AI Chat bubble - bottom left */}
        <g className="float-3">
          <rect x="18" y="200" width="95" height="60" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          {/* AI badge */}
          <rect x="28" y="210" width="28" height="14" rx="7" fill="#7C3AED" />
          <text x="34" y="220" fontSize="7" fontWeight="700" fill="white">AI</text>
          {/* Sparkle */}
          <g transform="translate(60, 209)">
            <path d="M6 0 L7.2 4.5 L12 6 L7.2 7.5 L6 12 L4.8 7.5 L0 6 L4.8 4.5 Z" fill="#FFD93D" />
          </g>
          {/* Chat lines */}
          <rect x="28" y="232" width="65" height="3.5" rx="1.75" fill="#D1D5DB" fillOpacity="0.7" />
          <rect x="28" y="240" width="50" height="3.5" rx="1.75" fill="#D1D5DB" fillOpacity="0.5" />
          <rect x="28" y="248" width="72" height="3.5" rx="1.75" fill="#D1D5DB" fillOpacity="0.4" />
        </g>

        {/* Floating chart/stats - right side */}
        <g className="float-1">
          <rect x="380" y="180" width="100" height="70" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          {/* Donut chart */}
          <circle cx="415" cy="210" r="18" fill="none" stroke="#F3F4F6" strokeWidth="5" />
          <circle cx="415" cy="210" r="18" fill="none" stroke="#7C3AED" strokeWidth="5" strokeDasharray="72 42" strokeLinecap="round" transform="rotate(-90 415 210)" />
          <circle cx="415" cy="210" r="18" fill="none" stroke="#3B82F6" strokeWidth="5" strokeDasharray="28 86" strokeLinecap="round" transform="rotate(135 415 210)" />
          <text x="407" y="213" fontSize="9" fontWeight="700" fill="#374151">63%</text>
          {/* Label */}
          <text x="443" y="205" fontSize="7" fill="#6B7280">Tasks</text>
          <text x="443" y="215" fontSize="7" fill="#6B7280">Done</text>
          {/* Mini bar */}
          <rect x="443" y="222" width="28" height="4" rx="2" fill="#F3F4F6" />
          <rect x="443" y="222" width="18" height="4" rx="2" fill="#10B981" />
          <text x="392" y="240" fontSize="6.5" fill="#9CA3AF">Sprint velocity: +12%</text>
        </g>

        {/* Floating notification badge */}
        <g className="float-2">
          <rect x="350" y="155" width="32" height="20" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="360" cy="165" r="4" fill="#FF6B6B" />
          <text x="367" y="169" fontSize="8" fontWeight="600" fill="#374151">3</text>
        </g>

        {/* Floating checkmark bubble */}
        <g className="float-3">
          <circle cx="150" cy="170" r="16" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <path d="M142 170 L148 176 L158 164" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Sparkle decorations */}
        <g className="pulse-soft">
          <path d="M80 160 L82 165 L87 167 L82 169 L80 174 L78 169 L73 167 L78 165 Z" fill="#FFD93D" fillOpacity="0.7" />
        </g>
        <g className="pulse-soft" style={{ animationDelay: "1s" }}>
          <path d="M460 140 L461.5 144 L466 145.5 L461.5 147 L460 151 L458.5 147 L454 145.5 L458.5 144 Z" fill="#7C3AED" fillOpacity="0.4" />
        </g>
        <g className="pulse-soft" style={{ animationDelay: "2s" }}>
          <path d="M340 40 L342 46 L348 48 L342 50 L340 56 L338 50 L332 48 L338 46 Z" fill="#3B82F6" fillOpacity="0.4" />
        </g>

        {/* Connecting dashed lines (subtle) */}
        <line x1="135" y1="115" x2="185" y2="195" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.15" className="dash-anim" />
        <line x1="370" y1="100" x2="295" y2="195" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.15" className="dash-anim" />
        <line x1="113" y1="230" x2="185" y2="230" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.12" className="dash-anim" />
      </svg>
    </div>
  );
}
