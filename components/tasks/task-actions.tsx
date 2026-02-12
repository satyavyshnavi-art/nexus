"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface TaskActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskActions({ onEdit, onDelete }: TaskActionsProps) {
  return (
    <div className="flex gap-2">
      <Button onClick={onEdit} variant="outline" size="sm">
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button onClick={onDelete} variant="destructive" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
