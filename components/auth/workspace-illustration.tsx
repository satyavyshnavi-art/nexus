"use client";

export function WorkspaceIllustration() {
  return (
    <div className="relative w-full max-w-[480px]">
      <svg
        viewBox="0 0 500 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl"
      >
        {/* Background card */}
        <rect x="40" y="30" width="420" height="300" rx="20" fill="white" fillOpacity="0.12" />

        {/* Browser/App window */}
        <rect x="70" y="60" width="260" height="180" rx="12" fill="white" fillOpacity="0.95" />
        <rect x="70" y="60" width="260" height="32" rx="12" fill="white" />
        <rect x="70" y="80" width="260" height="12" fill="white" />
        {/* Window dots */}
        <circle cx="88" cy="76" r="5" fill="#FF6B6B" />
        <circle cx="104" cy="76" r="5" fill="#FFD93D" />
        <circle cx="120" cy="76" r="5" fill="#6BCB77" />
        {/* URL bar */}
        <rect x="140" y="70" width="160" height="12" rx="6" fill="#F0F0F5" />

        {/* Kanban columns */}
        {/* Column 1 - To Do */}
        <rect x="82" y="102" width="72" height="16" rx="4" fill="#7C3AED" fillOpacity="0.15" />
        <text x="95" y="114" fontSize="8" fontWeight="600" fill="#7C3AED">To Do</text>
        <rect x="82" y="124" width="72" height="36" rx="6" fill="#F8F7FF" stroke="#E4E0F7" strokeWidth="1" />
        <rect x="90" y="132" width="40" height="4" rx="2" fill="#7C3AED" fillOpacity="0.6" />
        <rect x="90" y="140" width="52" height="3" rx="1.5" fill="#C4B5F5" fillOpacity="0.5" />
        <circle cx="146" cy="152" r="6" fill="#FFD93D" fillOpacity="0.7" />

        <rect x="82" y="166" width="72" height="30" rx="6" fill="#F8F7FF" stroke="#E4E0F7" strokeWidth="1" />
        <rect x="90" y="174" width="48" height="4" rx="2" fill="#7C3AED" fillOpacity="0.4" />
        <rect x="90" y="182" width="36" height="3" rx="1.5" fill="#C4B5F5" fillOpacity="0.4" />

        {/* Column 2 - In Progress */}
        <rect x="164" y="102" width="72" height="16" rx="4" fill="#3B82F6" fillOpacity="0.15" />
        <text x="171" y="114" fontSize="8" fontWeight="600" fill="#3B82F6">Progress</text>
        <rect x="164" y="124" width="72" height="42" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <rect x="172" y="132" width="44" height="4" rx="2" fill="#3B82F6" fillOpacity="0.6" />
        <rect x="172" y="140" width="56" height="3" rx="1.5" fill="#93C5FD" fillOpacity="0.5" />
        {/* Progress bar */}
        <rect x="172" y="150" width="48" height="5" rx="2.5" fill="#DBEAFE" />
        <rect x="172" y="150" width="32" height="5" rx="2.5" fill="#3B82F6" fillOpacity="0.7" />
        <circle cx="228" cy="158" r="6" fill="#6BCB77" fillOpacity="0.7" />

        {/* Column 3 - Done */}
        <rect x="246" y="102" width="72" height="16" rx="4" fill="#10B981" fillOpacity="0.15" />
        <text x="262" y="114" fontSize="8" fontWeight="600" fill="#10B981">Done</text>
        <rect x="246" y="124" width="72" height="34" rx="6" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
        <rect x="254" y="132" width="46" height="4" rx="2" fill="#10B981" fillOpacity="0.6" />
        <rect x="254" y="140" width="38" height="3" rx="1.5" fill="#6EE7B7" fillOpacity="0.5" />
        {/* Checkmark */}
        <circle cx="306" cy="148" r="7" fill="#10B981" fillOpacity="0.2" />
        <path d="M302 148 L305 151 L310 145" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Stats panel on the right */}
        <rect x="350" y="60" width="110" height="180" rx="12" fill="white" fillOpacity="0.95" />

        {/* Avatar stack */}
        <circle cx="378" cy="86" r="14" fill="#7C3AED" fillOpacity="0.2" />
        <circle cx="378" cy="86" r="10" fill="#7C3AED" fillOpacity="0.3" />
        <text x="374" y="90" fontSize="10" fontWeight="600" fill="#7C3AED">A</text>
        <circle cx="400" cy="86" r="14" fill="#3B82F6" fillOpacity="0.2" />
        <circle cx="400" cy="86" r="10" fill="#3B82F6" fillOpacity="0.3" />
        <text x="396" y="90" fontSize="10" fontWeight="600" fill="#3B82F6">B</text>
        <circle cx="422" cy="86" r="14" fill="#10B981" fillOpacity="0.2" />
        <circle cx="422" cy="86" r="10" fill="#10B981" fillOpacity="0.3" />
        <text x="417" y="90" fontSize="10" fontWeight="600" fill="#10B981">C</text>
        <circle cx="444" cy="86" r="14" fill="#F59E0B" fillOpacity="0.2" />
        <circle cx="444" cy="86" r="10" fill="#F59E0B" fillOpacity="0.3" />
        <text x="438" y="90" fontSize="10" fontWeight="600" fill="#F59E0B">+2</text>

        {/* Sprint velocity chart */}
        <rect x="364" y="110" width="82" height="6" rx="3" fill="#F3F4F6" />
        <rect x="364" y="110" width="58" height="6" rx="3" fill="#7C3AED" fillOpacity="0.6" />
        <text x="364" y="128" fontSize="7" fill="#6B7280">Sprint Velocity</text>

        {/* Donut chart placeholder */}
        <circle cx="405" cy="165" r="28" fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle cx="405" cy="165" r="28" fill="none" stroke="#7C3AED" strokeWidth="8" strokeDasharray="110 66" strokeLinecap="round" transform="rotate(-90 405 165)" />
        <circle cx="405" cy="165" r="28" fill="none" stroke="#3B82F6" strokeWidth="8" strokeDasharray="44 132" strokeLinecap="round" transform="rotate(135 405 165)" />
        <text x="395" y="168" fontSize="12" fontWeight="700" fill="#374151">63%</text>

        <text x="370" y="210" fontSize="7" fill="#6B7280">Tasks Completed</text>
        {/* Mini stats */}
        <rect x="364" y="218" width="36" height="14" rx="4" fill="#7C3AED" fillOpacity="0.1" />
        <text x="370" y="228" fontSize="7" fontWeight="600" fill="#7C3AED">12 Done</text>
        <rect x="406" y="218" width="36" height="14" rx="4" fill="#3B82F6" fillOpacity="0.1" />
        <text x="412" y="228" fontSize="7" fontWeight="600" fill="#3B82F6">7 Active</text>

        {/* AI sparkle icon */}
        <g transform="translate(345, 42)">
          <path d="M10 0 L12 7.5 L20 10 L12 12.5 L10 20 L8 12.5 L0 10 L8 7.5 Z" fill="#FFD93D" fillOpacity="0.9" />
        </g>
        <g transform="translate(56, 280)">
          <path d="M8 0 L9.5 6 L16 8 L9.5 10 L8 16 L6.5 10 L0 8 L6.5 6 Z" fill="white" fillOpacity="0.4" />
        </g>

        {/* Chat bubble floating */}
        <rect x="60" y="260" width="100" height="44" rx="10" fill="white" fillOpacity="0.9" />
        <polygon points="90,304 96,296 104,300" fill="white" fillOpacity="0.9" />
        <rect x="72" y="272" width="60" height="4" rx="2" fill="#7C3AED" fillOpacity="0.3" />
        <rect x="72" y="280" width="40" height="4" rx="2" fill="#7C3AED" fillOpacity="0.2" />
        <rect x="72" y="288" width="50" height="4" rx="2" fill="#7C3AED" fillOpacity="0.15" />
        {/* AI badge on chat */}
        <rect x="134" y="258" width="24" height="14" rx="7" fill="#7C3AED" />
        <text x="140" y="268" fontSize="7" fontWeight="700" fill="white">AI</text>

        {/* Notification bell */}
        <g transform="translate(420, 42)">
          <rect width="32" height="26" rx="8" fill="white" fillOpacity="0.9" />
          <path d="M16 6 C12 6 10 9 10 12 L10 16 L8 18 L24 18 L22 16 L22 12 C22 9 20 6 16 6Z" fill="#7C3AED" fillOpacity="0.4" />
          <circle cx="24" cy="8" r="5" fill="#FF6B6B" />
          <text x="22" y="11" fontSize="6" fontWeight="700" fill="white">3</text>
        </g>

        {/* Decorative dots */}
        <circle cx="48" cy="180" r="3" fill="white" fillOpacity="0.3" />
        <circle cx="48" cy="195" r="3" fill="white" fillOpacity="0.2" />
        <circle cx="48" cy="210" r="3" fill="white" fillOpacity="0.15" />
      </svg>

      {/* Floating animated elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/8 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 -right-8 w-10 h-10 rounded-lg bg-white/10 rotate-45 animate-pulse" style={{ animationDuration: '5s' }} />
    </div>
  );
}
