"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "./Toast";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Copy link" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { push } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      push({ title: "Copied!", type: "success", description: "Share your link anywhere you like." });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      push({
        title: "Copy failed",
        type: "error",
        description: "Please copy the link manually.",
      });
    }
  }

  return (
    <Button variant={copied ? "secondary" : "primary"} onClick={handleCopy}>
      {copied ? "Copied" : label}
    </Button>
  );
}
