'use client'

import { TaskStatus } from '@prisma/client'
import { Check } from 'lucide-react'

interface StatusTimelineProps {
  currentStatus: TaskStatus // 'todo' | 'progress' | 'review' | 'done'
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'progress', 'review', 'done']
const STATUS_LABELS = {
  todo: 'Todo',
  progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

const STATUS_COLORS = {
  todo: {
    inactive: 'bg-muted',
    active: 'bg-blue-500',
    text: 'text-muted-foreground',
  },
  progress: {
    inactive: 'bg-muted',
    active: 'bg-purple-500',
    text: 'text-muted-foreground',
  },
  review: {
    inactive: 'bg-muted',
    active: 'bg-orange-500',
    text: 'text-muted-foreground',
  },
  done: {
    inactive: 'bg-muted',
    active: 'bg-green-500',
    text: 'text-muted-foreground',
  },
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <div key={status} className="flex items-center flex-1">
              {/* Status dot/circle */}
              <div className="relative flex justify-center">
                <div
                  className={`
                    relative z-10 flex items-center justify-center
                    w-10 h-10 rounded-full font-medium text-sm
                    transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? `${STATUS_COLORS[status].active} text-white scale-125`
                          : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Glow effect for current status */}
                {isCurrent && (
                  <div
                    className={`
                      absolute inset-0 rounded-full blur-md opacity-30 animate-pulse
                      ${STATUS_COLORS[status].active}
                    `}
                  />
                )}
              </div>

              {/* Connecting line */}
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded-full transition-all duration-300
                    ${isCompleted || (isCurrent && index < currentIndex) ? 'bg-green-500' : 'bg-muted'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Status labels */}
      <div className="flex items-center justify-between gap-2 mt-3">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex-1 text-center">
            <span className="text-xs font-medium text-muted-foreground block">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
