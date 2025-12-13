import React from "react";

export function TypingBubble() {
  return (
    <div className="flex items-center gap-2 self-start px-4 py-2">
      <div className="h-8 w-8 rounded-full bg-nagisa-accentSoft flex items-center justify-center text-xs font-semibold text-nagisa-text">
        L
      </div>
      <div className="px-3 py-2 rounded-2xl bg-nagisa-bgSoft border border-nagisa-border flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-nagisa-accent animate-typing-dot"></span>
        <span className="h-2 w-2 rounded-full bg-nagisa-accent/80 animate-typing-dot [animation-delay:120ms]"></span>
        <span className="h-2 w-2 rounded-full bg-nagisa-accent/60 animate-typing-dot [animation-delay:240ms]"></span>
      </div>
    </div>
  );
}
