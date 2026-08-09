"use client";

import { cn } from "@/lib/utils";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useState } from "react";

const SPRING_DEFAULT = {
  bounce: 0.1,
  duration: 0.25,
  type: "spring" as const,
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const LINE_STAGGER = 0.02;
const WIPE_DURATION = 0.28;
const FLASH_DURATION = 0.35;

const SUCCESS_TINT = "oklch(72% 0.17 150 / 0.14)";
const DANGER_TINT = "oklch(63% 0.21 25 / 0.12)";

export type AIDiffLineKind = "added" | "removed" | "context";

export type AIDiffLine = {
  content: string;
  kind: AIDiffLineKind;
  /** Line number in the file. Omit for tabular data rather than code. */
  number?: number;
};

export type AIDiffProps = {
  className?: string;
  lines: AIDiffLine[];
  onAccept?: () => void;
  onReject?: () => void;
  /** File path or a description of what is being changed. */
  title?: string;
};

const PREFIX: Record<AIDiffLineKind, string> = {
  added: "+",
  context: " ",
  removed: "-",
};

const AIDiff = ({
  className,
  lines,
  onAccept,
  onReject,
  title,
}: AIDiffProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);

  const accept = () => {
    setDecision("accepted");
    onAccept?.();
  };
  const reject = () => {
    setDecision("rejected");
    onReject?.();
  };

  const added = lines.filter((line) => line.kind === "added").length;
  const removed = lines.filter((line) => line.kind === "removed").length;

  return (
    <motion.div
      animate={
        decision && !shouldReduceMotion
          ? {
              backgroundColor: [
                decision === "accepted" ? SUCCESS_TINT : DANGER_TINT,
                "rgb(0 0 0 / 0)",
              ],
            }
          : undefined
      }
      className={cn(
        "w-full overflow-hidden rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e]",
        className
      )}
      layout={!shouldReduceMotion}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              backgroundColor: { duration: FLASH_DURATION, ease: EASE_OUT },
              layout: SPRING_DEFAULT,
            }
      }
    >
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#27272a] px-3 py-2">
        {title ? (
          <span className="min-w-0 truncate font-mono text-gray-900 dark:text-white text-xs">
            {title}
          </span>
        ) : null}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
          <span className="text-green-600 dark:text-green-400">+{added}</span>
          <span className="text-red-600 dark:text-red-400">-{removed}</span>
        </span>
      </div>

      <AnimatePresence initial={false}>
        {decision !== "rejected" && (
          <motion.div
            className="overflow-hidden"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { height: 0, opacity: 0 }
            }
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          >
            <pre className="overflow-x-auto py-1 font-mono text-xs leading-relaxed">
              {lines.map((line, index) => (
                <motion.div
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { clipPath: "inset(0 0% 0 0)" }
                  }
                  className={cn(
                    "flex gap-3 px-3",
                    line.kind === "added" && "bg-green-500/10",
                    line.kind === "removed" && "bg-red-500/10"
                  )}
                  initial={
                    line.kind === "added" && !shouldReduceMotion
                      ? { clipPath: "inset(0 100% 0 0)" }
                      : false
                  }
                  key={index}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          delay: index * LINE_STAGGER,
                          duration: WIPE_DURATION,
                          ease: EASE_OUT,
                        }
                  }
                >
                  {line.number !== undefined && (
                    <span className="w-6 shrink-0 select-none text-right text-gray-400 dark:text-gray-500 tabular-nums">
                      {line.number}
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-2 shrink-0 select-none",
                      line.kind === "added" && "text-green-600 dark:text-green-400",
                      line.kind === "removed" && "text-red-600 dark:text-red-400",
                      line.kind === "context" && "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {PREFIX[line.kind]}
                  </span>
                  <span className="whitespace-pre text-gray-900 dark:text-white">
                    {line.content}
                  </span>
                </motion.div>
              ))}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {(onAccept || onReject) && !decision && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-[#27272a] px-3 py-2">
          {onReject ? (
            <button
              className="cursor-pointer rounded-lg px-2.5 py-1 text-gray-500 dark:text-gray-400 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-[#1f1f22] hover:text-gray-900 dark:hover:text-white"
              onClick={reject}
              type="button"
            >
              Rejeitar
            </button>
          ) : null}
          {onAccept ? (
            <button
              className="cursor-pointer rounded-lg bg-gray-900 dark:bg-white px-2.5 py-1 text-white dark:text-black text-xs"
              onClick={accept}
              type="button"
            >
              Aceitar
            </button>
          ) : null}
        </div>
      )}

      {decision ? (
        <motion.p
          animate={{ opacity: 1 }}
          className="border-t border-gray-200 dark:border-[#27272a] px-3 py-2 text-gray-500 dark:text-gray-400 text-xs capitalize"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.2, ease: EASE_OUT }
          }
        >
          {decision === "accepted" ? "Aceito" : "Rejeitado"}
        </motion.p>
      ) : null}
    </motion.div>
  );
};

export default AIDiff;
