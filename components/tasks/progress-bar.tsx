'use client'

import { useEffect, useState } from 'react'

interface ProgressBarProps {
  percentage: number // 0-100
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' // default 'md'
}

export function ProgressBar({
  percentage,
  label,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Clamp percentage to 0-100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Calculate colors based on percentage
  const getColor = (percent: number) => {
    if (percent < 25) return 'bg-red-500'
    if (percent < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Size mapping
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const containerPadding = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-2',
  }

  return (
    <div className={`flex flex-col ${containerPadding[size]}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          <span className="text-xs text-muted-foreground">
            {mounted ? clampedPercentage : 0}%
          </span>
        </div>
      )}

      {/* Background bar */}
      <div
        className={`relative w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={mounted ? clampedPercentage : 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Progress fill with gradient */}
        <div
          className={`h-full ${getColor(clampedPercentage)} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: mounted ? `${clampedPercentage}%` : '0%',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>
    </div>
  )
}
