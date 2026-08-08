"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Transition Physics
// ----------------------------------------------------------------------
const SPRING_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
const SMOOTH_HEIGHT_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.15s ease-out";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Attachment {
  id: string;
  file: File;
  url: string;
  name: string;
  width?: number;
  height?: number;
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------
function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | "auto">("auto");
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) setWidth(spanRef.current.offsetWidth);
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-1">{text}</span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap ai-animate-in ai-fade-in ai-zoom-in-95"
      >
        {text}
      </span>
    </span>
  );
}

function ModelIcon({ model, className }: { model: string; className?: string }) {
  const icons: Record<string, string> = {
    "Composer 2.5": "https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/cursor-ai-code-icon_j4vnux.svg",
    "Gemini 3.5 Flash": "https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/google-gemini-icon_l6kk5q.svg",
    "GPT 5.5": "https://res.cloudinary.com/drhx7imeb/image/upload/v1781695269/openai-icon_zozuib.svg",
    "Opus 4.8": "https://res.cloudinary.com/drhx7imeb/image/upload/v1781695268/Claude_AI_symbol_yqfzlc.svg",
    "GLM 5.2": "https://res.cloudinary.com/drhx7imeb/image/upload/v1781695269/z-ai-icon_xi4xvo.svg",
  };
  const filters: Record<string, string> = {
    "GPT 5.5": "dark:invert",
  };
  return (
    <img
      src={icons[model] || icons["GPT 5.5"]}
      alt={model}
      onError={(e) => { (e.currentTarget.style.display = 'none'); }}
      className={cn("object-contain", filters[model], className)}
    />
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 6.5V7a4.25 4.25 0 0 0 8.5 0v-.5M7 11.25V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function DynamicBarsIcon({ level }: { level: string }) {
  const isMediumOrHigh = level === "Medium" || level === "Max Effort";
  const isHigh = level === "Max Effort";
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="8" width="2.5" height="4.5" rx="1" fill="currentColor" opacity={1} />
      <rect x="5.75" y="5" width="2.5" height="7.5" rx="1" fill="currentColor" opacity={isMediumOrHigh ? 1 : 0.3} />
      <rect x="10" y="2" width="2.5" height="10.5" rx="1" fill="currentColor" opacity={isHigh ? 1 : 0.3} />
    </svg>
  );
}

// ----------------------------------------------------------------------
// Attachment Thumbnail
// ----------------------------------------------------------------------
function AttachmentThumb({
  attachment,
  index,
  onRemove,
}: {
  attachment: Attachment;
  index: number;
  onRemove: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => { e.stopPropagation(); }}
      style={{ animationDelay: `${index * 35}ms`, animationFillMode: "backwards" }}
      className={cn(
        "group relative size-12 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-[#27272a] bg-gray-100 dark:bg-[#18181b] outline-none",
        "transition-transform duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.04] active:scale-[0.96]",
        "ai-animate-in ai-fade-in"
      )}
      aria-label={`Open preview of ${attachment.name}`}
    >
      <img src={attachment.url} alt={attachment.name} className="size-full object-cover" draggable={false} />
      <span className="absolute inset-0 flex items-start justify-end bg-black/0 hover:bg-black/25 transition-colors duration-200">
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); onRemove(attachment.id); }}
          className="m-1 flex size-4 items-center justify-center rounded-full bg-white/90 dark:bg-[#18181b]/90 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-white dark:hover:bg-[#27272a]"
        >
          <CloseIcon />
        </span>
      </span>
    </button>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export interface PromptInputProps {
  onSubmit?: (value: string, meta: { model: string; effort: string; attachments: File[] }) => void;
  placeholder?: string;
  className?: string;
  models?: string[];
  efforts?: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  maxAttachments?: number;
}

export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      onSubmit,
      placeholder = "Ask anything",
      className,
      models = ["GPT 5.5", "Opus 4.8", "Gemini 3.5 Flash", "Composer 2.5", "GLM 5.2"],
      efforts = ["Low", "Medium", "Max Effort"],
      defaultValue = "",
      value: controlledValue,
      onChange,
      maxAttachments = 6,
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(false);
    const [isSmoothResize, setIsSmoothResize] = useState(false);
    const [localValue, setLocalValue] = useState(defaultValue);
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [effortIndex, setEffortIndex] = useState(1);
    const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [hoverStyle, setHoverStyle] = useState({ opacity: 0, transform: "translateY(0px) scale(0.95)", transition: "none" });
    const [containerHeight, setContainerHeight] = useState(116);
    const [textareaHeight, setTextareaHeight] = useState(68);
    const [isScrolling, setIsScrolling] = useState(false);
    const valueRef = useRef(controlledValue !== undefined ? controlledValue : localValue);

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    const hasValue = value.trim() !== "" || attachments.length > 0;
    const hasAttachments = attachments.length > 0;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const topFadeRef = useRef<HTMLDivElement>(null);
    const bottomFadeRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { valueRef.current = value; }, [value]);

    const updateFades = () => {
      const el = textareaRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (topFadeRef.current) topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
      if (bottomFadeRef.current) {
        const bottomScroll = scrollHeight - clientHeight - scrollTop;
        bottomFadeRef.current.style.opacity = Math.min(Math.max(bottomScroll - 16, 0) / 10, 1).toString();
      }
    };

    const handleValueChange = useCallback((val: string) => {
      setIsSmoothResize(true);
      if (!isControlled) setLocalValue(val);
      onChange?.(val);
    }, [isControlled, onChange]);

    const expand = () => {
      setIsSmoothResize(false);
      setExpanded(true);
    };

    useEffect(() => {
      if ((value.trim() !== "" || hasAttachments) && !expanded) {
        setIsSmoothResize(false);
        setExpanded(true);
      }
    }, [value, expanded, hasAttachments]);

    useEffect(() => {
      if (expanded) {
        const timer = setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [expanded]);

    useEffect(() => {
      if (!textareaRef.current) return;
      const el = textareaRef.current;
      el.style.transition = 'none';
      el.style.height = "0px";
      const scrollHeight = el.scrollHeight;
      el.style.height = "auto";
      void el.offsetHeight;
      el.style.transition = '';
      const newHeight = Math.max(68, Math.min(scrollHeight, 160));
      el.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
      setIsScrolling(scrollHeight > 160);
      setTimeout(updateFades, 0);
    }, [value, expanded]);

    useEffect(() => {
      setContainerHeight(Math.max(116, textareaHeight + 48));
      setTimeout(updateFades, 0);
    }, [textareaHeight]);

    useEffect(() => {
      if (!isModelSelectOpen) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (internalContainerRef.current && !internalContainerRef.current.contains(e.target as Node)) setIsModelSelectOpen(false);
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isModelSelectOpen]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (internalContainerRef.current && internalContainerRef.current.contains(e.relatedTarget as Node)) return;
      if (value.trim() === "" && !hasAttachments) {
        setIsSmoothResize(false);
        setExpanded(false);
        setIsModelSelectOpen(false);
      }
    };

    const handleSubmit = () => {
      if (value.trim() === "" && !hasAttachments) return;
      setIsSmoothResize(false);
      onSubmit?.(value, { model: selectedModel, effort: efforts[effortIndex], attachments: attachments.map((a) => a.file) });
      handleValueChange("");
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
      setAttachments([]);
      setExpanded(false);
      setIsModelSelectOpen(false);
    };

    const cycleEffort = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEffortIndex((prev) => (prev + 1) % efforts.length);
    };

    const openFileChooser = (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    };

    const addAttachment = (file: File, url: string, width: number, height: number) => {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
      setAttachments((prev) => [...prev, { id, file, url, name: file.name, width, height }]);
    };

    const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
      e.target.value = "";
      if (files.length === 0) return;
      const room = Math.max(0, maxAttachments - attachments.length);
      const accepted = files.slice(0, room);
      if (!expanded) { setIsSmoothResize(false); setExpanded(true); } else { setIsSmoothResize(true); }
      for (const file of accepted) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight);
        img.onerror = () => addAttachment(file, url, 800, 600);
        img.src = url;
      }
    };

    const removeAttachment = (id: string) => {
      setIsSmoothResize(true);
      setAttachments((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((a) => a.id !== id);
      });
    };

    const showArrow = hasValue;
    const showMic = !hasValue;

    return (
      <div
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          // @ts-ignore
          internalContainerRef.current = node;
        }}
        onBlur={handleBlur}
        className={cn("relative flex flex-col w-full", className)}
        style={{
          maxWidth: expanded ? 480 : 320,
          transition: isSmoothResize ? "max-width 0.15s ease-out" : "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChosen}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Attachment Tab */}
        <div
          aria-hidden={!hasAttachments}
          style={{
            height: hasAttachments && expanded ? 68 : 0,
            transition: isSmoothResize ? "height 0.15s ease-out" : "height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          className="w-full relative z-0 overflow-hidden"
        >
          <div
            style={{
              position: "absolute",
              bottom: -8,
              left: 20,
              right: 20,
              height: 68,
              transform: hasAttachments && expanded ? "translateY(0)" : "translateY(100%)",
              opacity: hasAttachments && expanded ? 1 : 0,
              transition: isSmoothResize ? "transform 0.15s ease-out, opacity 0.15s ease-out" : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out",
            }}
            className="border border-gray-200 dark:border-[#27272a] border-b-0 bg-gray-100 dark:bg-[#18181b] rounded-t-2xl px-2 pt-2 pb-1 flex items-start gap-2 overflow-x-auto"
          >
            {attachments.map((attachment, index) => (
              <AttachmentThumb key={attachment.id} attachment={attachment} index={index} onRemove={removeAttachment} />
            ))}
          </div>
        </div>

        {/* Main Input Card */}
        <div
          onMouseDown={(e) => {
            const isTextarea = e.target === textareaRef.current;
            if (expanded && !isTextarea) { e.preventDefault(); textareaRef.current?.focus(); }
          }}
          style={{
            borderRadius: 24,
            height: expanded ? containerHeight : 48,
            transition: isSmoothResize ? SMOOTH_HEIGHT_TRANSITION : SPRING_TRANSITION,
            overflow: expanded ? "visible" : "hidden",
          }}
          className={cn(
            "relative w-full border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1a1a1c] shadow-sm focus-within:border-blue-400/60 focus-within:ring-1 focus-within:ring-blue-500/20 z-10",
            expanded ? "cursor-text" : "cursor-default"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onScroll={updateFades}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              if (e.key === "Escape" && value.trim() === "" && !hasAttachments) {
                setIsSmoothResize(false); setExpanded(false); setIsModelSelectOpen(false);
              }
            }}
            placeholder={placeholder}
            aria-label="Prompt"
            style={{
              transition: isSmoothResize ? "height 0.15s ease-out" : "opacity 0.3s ease-out, transform 0.3s ease-out, height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
            className={cn(
              "absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 py-3.5 text-sm leading-[22px] text-gray-900 dark:text-white outline-none placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 cursor-text",
              expanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
              isScrolling ? "overflow-y-auto" : "overflow-y-hidden"
            )}
          />

          <div ref={topFadeRef} className="absolute left-4 right-12 top-0 z-[2] h-8 bg-gradient-to-b from-white dark:from-[#1a1a1c] via-white/90 dark:via-[#1a1a1c]/90 to-transparent pointer-events-none" />
          <div ref={bottomFadeRef} className="absolute left-4 right-12 z-[2] h-8 bg-gradient-to-t from-white dark:from-[#1a1a1c] via-white/90 dark:via-[#1a1a1c]/90 to-transparent pointer-events-none" style={{ opacity: 0, top: `${textareaHeight - 32}px` }} />

          <button
            type="button"
            onClick={expand}
            style={{ transition: isSmoothResize ? "none" : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
            className={cn(
              "absolute inset-x-0 top-0 z-[1] cursor-text pl-4 pr-12 py-[15px] text-left text-sm font-medium leading-[17px] text-gray-400 dark:text-gray-500 outline-none",
              !expanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-105 translate-y-1 pointer-events-none"
            )}
            aria-label="Open prompt input"
          >
            {placeholder}
          </button>

          {/* Bottom Actions */}
          <div
            className={cn(
              "absolute bottom-2 left-3 right-12 z-[10] flex items-center gap-0 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
              expanded ? "opacity-100 blur-0 translate-y-0 pointer-events-auto" : "opacity-0 blur-sm translate-y-2 pointer-events-none"
            )}
          >
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); setIsModelSelectOpen((prev) => !prev); }}
                className={cn(
                  "group flex items-center gap-1 rounded-full px-2 py-1 text-gray-500 dark:text-gray-400 transition-all duration-200 outline-none hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-gray-900 dark:hover:text-white cursor-default",
                  isModelSelectOpen ? "bg-gray-100 dark:bg-[#27272a] text-gray-900 dark:text-white" : ""
                )}
                aria-label={`Select model. Current: ${selectedModel}`}
              >
                <ModelIcon model={selectedModel} className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-semibold select-none transition-colors"><MorphingText text={selectedModel} /></span>
              </button>

              <div
                style={{ transformOrigin: "bottom left" }}
                className={cn(
                  "absolute bottom-full left-0 mb-2.5 z-50 w-44 rounded-2xl border border-gray-200 dark:border-[#27272a] bg-white/95 dark:bg-[#18181b]/95 p-1 shadow-xl backdrop-blur-md flex flex-col gap-0.5 transition-all duration-400 cursor-default",
                  isModelSelectOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-3 pointer-events-none"
                )}
              >
                <div className="relative flex flex-col gap-0.5">
                  <div style={hoverStyle} className="absolute left-0 right-0 top-0 h-8 -z-10 rounded-xl bg-gray-100 dark:bg-[#27272a] pointer-events-none" />
                  {models.map((model, idx) => (
                    <button
                      key={model}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        setHoverStyle({
                          opacity: 1, transform: `translateY(${idx * 34}px) scale(1)`,
                          transition: hoverStyle.opacity === 0 ? "opacity 0.15s ease-out" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease",
                        });
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedModel(model); setIsModelSelectOpen(false); }}
                      className="group relative flex h-8 w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 outline-none active:scale-[0.98] cursor-default"
                    >
                      <span className="flex items-center gap-2">
                        <ModelIcon model={model} className="size-3.5 opacity-85 group-hover:opacity-100 transition-opacity" />
                        {model}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button" onMouseDown={(e) => e.preventDefault()} onClick={cycleEffort}
              className="group flex items-center gap-1 rounded-full px-2 py-1 text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-gray-900 dark:hover:text-white outline-none cursor-default"
            >
              <DynamicBarsIcon level={efforts[effortIndex]} />
              <span className="text-xs font-semibold select-none transition-colors"><MorphingText text={efforts[effortIndex]} /></span>
            </button>

            <button
              type="button" onMouseDown={(e) => e.preventDefault()} onClick={openFileChooser} disabled={attachments.length >= maxAttachments}
              className="ml-auto flex size-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-gray-900 dark:hover:text-white outline-none cursor-default disabled:opacity-40 disabled:pointer-events-none"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); if (hasValue) handleSubmit(); }}
            aria-label="Send prompt"
            style={{ borderRadius: 9999 }}
            className="absolute right-2 bottom-2 z-[10] flex h-8 w-8 items-center justify-center bg-black dark:bg-white text-white dark:text-black transition-all duration-300 hover:opacity-90 outline-none cursor-default"
          >
            <span className="relative flex h-full w-full items-center justify-center">
              <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]", showArrow ? "opacity-100 scale-100 rotate-0 blur-none" : "opacity-0 scale-50 rotate-45 blur-[1px] pointer-events-none")}>
                <ArrowUpIcon />
              </span>
              <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]", showMic ? "opacity-100 scale-100 rotate-0 blur-none" : "opacity-0 scale-50 -rotate-45 blur-[1px] pointer-events-none")}>
                <MicIcon />
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
