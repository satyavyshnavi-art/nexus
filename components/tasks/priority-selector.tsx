"use client";

import { TaskPriority } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

const priorities = [
  { value: TaskPriority.low, label: "Low", color: "text-gray-600 dark:text-gray-400" },
  { value: TaskPriority.medium, label: "Medium", color: "text-yellow-600 dark:text-yellow-400" },
  { value: TaskPriority.high, label: "High", color: "text-orange-600 dark:text-orange-400" },
  { value: TaskPriority.critical, label: "Critical", color: "text-red-600 dark:text-red-400" },
] as const;

export function PrioritySelector({
  value,
  onChange,
  disabled,
}: PrioritySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {priorities.map((priority) => (
          <SelectItem key={priority.value} value={priority.value}>
            <span className={priority.color}>{priority.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
