"use client";

import { TaskType } from "@prisma/client";
import { CheckSquare, Bug, BookOpen } from "lucide-react";

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
  disabled?: boolean;
}

export function TaskTypeSelector({
  value,
  onChange,
  disabled,
}: TaskTypeSelectorProps) {
  const types = [
    { value: TaskType.task, label: "Ticket", icon: CheckSquare, color: "blue" },
    { value: TaskType.bug, label: "Bug", icon: Bug, color: "red" },
    { value: TaskType.story, label: "Story", icon: BookOpen, color: "green" },
  ];

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
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border-2 transition-colors ${
              isSelected
                ? `border-${type.color}-500 bg-${type.color}-50`
                : "border-gray-300 hover:border-gray-400"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
