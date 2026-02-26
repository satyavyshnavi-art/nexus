"use client";

import { TaskType } from "@prisma/client";
import { CheckSquare, Bug, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
  disabled?: boolean;
}

const types = [
  {
    value: TaskType.task,
    label: "Ticket",
    icon: CheckSquare,
    selectedClass: "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  {
    value: TaskType.bug,
    label: "Bug",
    icon: Bug,
    selectedClass: "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300",
  },
  {
    value: TaskType.story,
    label: "Story",
    icon: BookOpen,
    selectedClass: "border-green-500 bg-green-500/15 text-green-700 dark:text-green-300",
  },
] as const;

export function TaskTypeSelector({
  value,
  onChange,
  disabled,
}: TaskTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            disabled={disabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border-2 transition-colors",
              isSelected
                ? type.selectedClass
                : "border-border text-muted-foreground hover:border-muted-foreground/50",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "cursor-pointer"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
