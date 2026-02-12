"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface AssigneeSelectorProps {
  members: User[];
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function AssigneeSelector({
  members,
  value,
  onChange,
  disabled,
}: AssigneeSelectorProps) {
  return (
    <Select
      value={value || "unassigned"}
      onValueChange={(v) => onChange(v === "unassigned" ? undefined : v)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select assignee" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.name || member.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
