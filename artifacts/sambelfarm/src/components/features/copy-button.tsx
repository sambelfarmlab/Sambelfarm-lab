import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  text: string;
  label: string;
}

/** Button that copies text to clipboard and shows a brief confirmation. */
export function CopyButton({ text, label }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 text-[10px] gap-1 px-2"
    >
      {copied ? (
        <>
          <Check size={10} />
          {label} disalin
        </>
      ) : (
        <>
          <Copy size={10} />
          Salin {label}
        </>
      )}
    </Button>
  );
}
