'use client'

import { Task, TaskStatus } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckSquare, Bug, BookOpen } from 'lucide-react'
import { ProgressBar } from './progress-bar'
import { useState } from 'react'

interface SubtaskProgressProps {
  subtasks: Task[]
  onToggle?: (taskId: string, newStatus: TaskStatus) => Promise<void>
  isLoading?: boolean
}

const typeIcons = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
}

const statusPriority = {
  todo: 0,
  progress: 1,
  review: 2,
  done: 3,
}

export function SubtaskProgress({
  subtasks,
  onToggle,
  isLoading = false,
}: SubtaskProgressProps) {
  const [optimisticStates, setOptimisticStates] = useState<
    Record<string, TaskStatus>
  >({})

  const completedCount = subtasks.filter((task) => {
    const status = optimisticStates[task.id] || task.status
    return status === 'done'
  }).length

  const totalCount = subtasks.length
  const percentageComplete =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggle = async (task: Task) => {
    if (!onToggle) return

    // Optimistic update: toggle between done and the previous state
    const currentStatus = optimisticStates[task.id] || task.status
    const newStatus: TaskStatus =
      currentStatus === 'done'
        ? 'todo' // Default to todo when unchecking
        : 'done'

    // Optimistic UI update
    setOptimisticStates((prev) => ({
      ...prev,
      [task.id]: newStatus,
    }))

    try {
      await onToggle(task.id, newStatus)
    } catch (error) {
      // Revert on error
      setOptimisticStates((prev) => {
        const newState = { ...prev }
        delete newState[task.id]
        return newState
      })
      console.error('Failed to update subtask:', error)
    }
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Subtasks
        </span>
        <span className="text-xs text-muted-foreground">
          {completedCount} of {totalCount} complete
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        percentage={percentageComplete}
        showLabel={false}
        size="sm"
      />

      {/* Subtasks list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {subtasks.map((subtask) => {
          const Icon = typeIcons[subtask.type]
          const status = optimisticStates[subtask.id] || subtask.status
          const isCompleted = status === 'done'

          return (
            <div
              key={subtask.id}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors"
            >
              {/* Checkbox */}
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => handleToggle(subtask)}
                disabled={isLoading}
                className="mt-1"
                aria-label={`Toggle subtask: ${subtask.title}`}
              />

              {/* Subtask info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span
                    className={`text-sm truncate transition-all ${isCompleted
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                      }`}
                  >
                    {subtask.title}
                  </span>
                </div>

                {/* Status indicator */}
                {!isCompleted && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full ${status === 'progress'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : status === 'review'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {status === 'todo'
                        ? 'Todo'
                        : status === 'progress'
                          ? 'In Progress'
                          : 'Review'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-500">
            {subtasks.filter((t) => {
              const s = optimisticStates[t.id] || t.status
              return s === 'todo'
            }).length}
          </div>
          <div className="text-xs text-muted-foreground">Todo</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-500">
            {subtasks.filter((t) => {
              const s = optimisticStates[t.id] || t.status
              return s === 'progress'
            }).length}
          </div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-500">
            {completedCount}
          </div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>
      </div>
    </div>
  )
}
