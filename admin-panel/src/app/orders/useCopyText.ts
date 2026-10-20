"use client";

import { useToast } from "@/components/ui/toast";

export function useCopyText() {
  const { addToast } = useToast();
  return async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: "success", title: "Copied", description: text });
    } catch {
      addToast({ type: "error", title: "Copy failed", description: "Select the text and copy it manually." });
    }
  };
}
