"use client";

import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { useEffect, useRef, useState } from "react";

const DEFAULT_THINKING = `Okay, I'm analyzing the request and planning the best approach...

First, I need to understand what the user wants to build. Let me break down the requirements and think about the best architecture.

I should consider the structure, components, and styling approach. Using modern React patterns with hooks will keep the code clean and maintainable.

I'll need to think about state management, data flow, and how different parts of the application interact.

Let me plan the implementation steps carefully before generating the code.`;

export function AIThinkingBlock({ text }: { text?: string }) {
  const ThinkingContent = text || DEFAULT_THINKING;

  const [scrollPosition, setScrollPosition] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      const clientHeight = contentRef.current.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      scrollIntervalRef.current = setInterval(() => {
        setScrollPosition((prev) => {
          const newPosition = prev + 1;
          if (newPosition >= maxScroll) return 0;
          return newPosition;
        });
      }, 5);

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [ThinkingContent]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  return (
    <div className="flex flex-col w-full max-w-xl">
      <div className="flex items-center justify-start gap-2 mb-3">
        <Loader size="sm" />
        <p
          className="bg-[linear-gradient(110deg,#6b7280,35%,#ffffff,50%,#6b7280,75%,#6b7280)] dark:bg-[linear-gradient(110deg,#404040,35%,#ffffff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-base text-transparent"
          style={{ animation: "ai-shimmer 5s linear infinite" }}
        >
          Codegem AI está pensando
        </p>
        <span className="text-sm text-gray-400 dark:text-gray-500">{timer}s</span>
        <style>{`
          @keyframes ai-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>

      <Card className="relative h-[150px] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] p-2 rounded-xl">
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-50 dark:from-[#0c0c0e] via-gray-50/60 dark:via-[#0c0c0e]/60 to-transparent z-10 pointer-events-none h-[80px]" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 dark:from-[#0c0c0e] via-gray-50/60 dark:via-[#0c0c0e]/60 to-transparent z-10 pointer-events-none h-[80px]" />

        <div
          ref={contentRef}
          className="h-full overflow-hidden p-4 text-gray-700 dark:text-gray-200"
          style={{ scrollBehavior: "auto" }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ThinkingContent}</p>
        </div>
      </Card>
    </div>
  );
}

export default AIThinkingBlock;
