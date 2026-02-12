'use client'

import { useEffect, useState } from 'react'

interface ProgressRingProps {
  percentage: number // 0-100
  size?: number // pixels, default 80
  strokeWidth?: number // default 4
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 4,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Clamp percentage to 0-100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Calculate colors based on percentage
  const getColor = (percent: number) => {
    if (percent < 25) return 'rgb(239, 68, 68)' // red-500
    if (percent < 75) return 'rgb(234, 179, 8)' // yellow-500
    return 'rgb(34, 197, 94)' // green-500
  }

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference

  const color = getColor(clampedPercentage)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? strokeDashoffset : circumference}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.05))',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {mounted ? clampedPercentage : 0}%
          </span>
        </div>
      </div>
    </div>
  )
}
