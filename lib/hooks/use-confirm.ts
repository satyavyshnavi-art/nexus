"use client";

import { useState } from "react";

interface UseConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>({
    title: "",
    description: "",
  });
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (opts: UseConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    resolver?.resolve(true);
    setIsOpen(false);
    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.resolve(false);
    setIsOpen(false);
    setResolver(null);
  };

  return {
    confirm,
    isOpen,
    options,
    handleConfirm,
    handleCancel,
    setIsOpen,
  };
}
