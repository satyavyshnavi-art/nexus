"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VerticalModal } from "./vertical-modal";
import { Plus } from "lucide-react";

export function CreateVerticalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Vertical
      </Button>
      <VerticalModal open={open} onOpenChange={setOpen} />
    </>
  );
}
