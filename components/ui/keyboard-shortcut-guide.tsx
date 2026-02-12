"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

interface KeyboardShortcutGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutGuide({
  open,
  onOpenChange,
}: KeyboardShortcutGuideProps) {
  const shortcuts = [
    { keys: ["N"], description: "Create new ticket (when sprint is active)" },
    { keys: ["S"], description: "Create new sprint (admin only)" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["ESC"], description: "Close modal or dialog" },
    { keys: ["Ctrl", "K"], description: "Search (coming soon)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate Nexus faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
