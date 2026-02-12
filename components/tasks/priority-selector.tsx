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

export function PrioritySelector({
  value,
  onChange,
  disabled,
}: PrioritySelectorProps) {
  const priorities = [
    { value: TaskPriority.low, label: "Low", color: "text-gray-600" },
    { value: TaskPriority.medium, label: "Medium", color: "text-yellow-600" },
    { value: TaskPriority.high, label: "High", color: "text-orange-600" },
    { value: TaskPriority.critical, label: "Critical", color: "text-red-600" },
  ];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
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
