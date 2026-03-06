"use client";

import {
  Component,
  type ErrorInfo,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ComponentRenderer,
  useTambo,
  useTamboSuggestions,
  useTamboThreadInput,
} from "@tambo-ai/react";
import {
  Bot,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import styles from "./TamboAgentWidget.module.css";

const PLACEHOLDER_THREAD_ID = "placeholder";
const MAX_TEXTAREA_HEIGHT = 156;

type WebsiteArtifact = {
  id: string;
  kind: "website";
  createdAt?: string;
  ok: boolean;
  applied: boolean;
  subdomain?: string;
  pathUrl?: string;
  hostUrl?: string;
  message?: string;
};

type FileArtifact = {
  id: string;
  kind: "file";
  createdAt?: string;
  ok: boolean;
  fileName: string;
  format: string;
  downloadUrl?: string;
  note?: string;
};

type TamboArtifact = WebsiteArtifact | FileArtifact;

function getToolResultText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const blocks = (content as { content?: unknown }).content;
  if (!Array.isArray(blocks)) return "";

  const text = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const type = (block as { type?: unknown }).type;
      if (type !== "text") return "";
      const value = (block as { text?: unknown }).text;
      return typeof value === "string" ? value : "";
    })
    .filter((value) => value.length > 0)
    .join("\n")
    .trim();

  return text;
}

function parseToolResultObject(raw: string): Record<string, unknown> | null {
  const normalized = raw.trim();
  if (!normalized) return null;

  const candidates: string[] = [normalized];
  const codeFenceMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) {
    candidates.push(codeFenceMatch[1].trim());
  }

  const objectMatch = normalized.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore parsing attempts until a valid JSON object is found.
    }
  }

  return null;
}

class TamboComponentErrorBoundary extends Component<
  { children: ReactNode; componentName: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console -- preserve runtime diagnostics for third-party UI renderer failures.
    console.error(
      `[TamboComponentErrorBoundary] Failed to render "${this.props.componentName}"`,
      error,
      info
    );
  }

  componentDidUpdate(prevProps: { componentName: string }) {
    if (this.state.hasError && prevProps.componentName !== this.props.componentName) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.componentError}>
          Component render failed. Try reloading this chat response.
        </div>
      );
    }
    return this.props.children;
  }
}

function TamboSuggestionsBar({ disabled }: { disabled: boolean }) {
  const { suggestions, accept, isFetching } = useTamboSuggestions({
    maxSuggestions: 3,
  });

  if (suggestions.length === 0) return null;

  return (
    <div className={styles.suggestions}>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          type="button"
          variant="secondary"
          size="sm"
          className={styles.suggestionButton}
          onClick={() => accept({ suggestion })}
          disabled={disabled || isFetching}
          title={suggestion.detailedSuggestion}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {suggestion.title ?? "Suggestion"}
        </Button>
      ))}
    </div>
  );
}

function TamboEmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden>
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Ask anything about your admin data</p>
        <p className="text-xs text-muted-foreground">
          Try requests like: latest order trends, low-performing couriers, monthly salary
          changes, or render this as a chart.
        </p>
      </div>
    </div>
  );
}

export function TamboAgentWidget() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const enableSuggestions =
    process.env.NEXT_PUBLIC_TAMBO_ENABLE_SUGGESTIONS === "true";
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderedBlockCountRef = useRef(0);

  const {
    messages,
    isStreaming,
    currentThreadId,
    initThread,
    startNewThread,
    isIdentified,
  } = useTambo();
  const { value, setValue, submit, isPending, isDisabled } =
    useTamboThreadInput();

  useEffect(() => {
    if (!isOpen) return;
    initThread(currentThreadId);
  }, [isOpen, initThread, currentThreadId]);

  useEffect(() => {
    if (!isOpen) return;
    const renderedBlockCount = messages.length + (isStreaming ? 1 : 0);
    const shouldAnimate = renderedBlockCount > renderedBlockCountRef.current;
    bottomRef.current?.scrollIntoView({ behavior: shouldAnimate ? "smooth" : "auto" });
    renderedBlockCountRef.current = renderedBlockCount;
  }, [messages.length, isStreaming, isOpen]);

  useEffect(() => {
    if (!isOpen || !isFullscreen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => textareaRef.current?.focus(), 40);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, isFullscreen]);

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    syncTextareaHeight();
  }, [value, syncTextareaHeight, isOpen]);

  const hasRealThread = currentThreadId !== PLACEHOLDER_THREAD_ID;
  const canUseSuggestions = enableSuggestions && isIdentified && hasRealThread;
  const hasInput = value.trim().length > 0;

  const handleSend = useCallback(async () => {
    if (!hasInput || isDisabled || isPending) return;
    const result = await submit();
    if (result.threadId && result.threadId !== currentThreadId) {
      initThread(result.threadId);
    }
  }, [currentThreadId, hasInput, initThread, isDisabled, isPending, submit]);

  const handleNewThread = useCallback(() => {
    startNewThread();
    setValue("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [setValue, startNewThread]);

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      void handleSend();
    },
    [handleSend]
  );

  const widgetLabel = useMemo(
    () => (isFullscreen ? "Tambo AI fullscreen chat" : "Tambo AI chat"),
    [isFullscreen]
  );

  type ThreadMessage = (typeof messages)[number];
  type ThreadContent = ThreadMessage["content"][number];

  const toolProgress = useMemo(() => {
    const started = new Set<string>();
    const completed = new Set<string>();

    messages.forEach((message) => {
      message.content.forEach((content) => {
        if (content.type === "tool_use") {
          const fallbackId = `${message.id}:${content.name}`;
          const toolId = typeof content.id === "string" ? content.id : fallbackId;
          started.add(toolId);

          const statusValue =
            "status" in content && typeof content.status === "string" ? content.status : "";
          if (statusValue === "completed" || statusValue === "failed" || statusValue === "cancelled") {
            completed.add(toolId);
          }
        }

        if (content.type === "tool_result" && typeof content.toolUseId === "string") {
          started.add(content.toolUseId);
          completed.add(content.toolUseId);
        }
      });
    });

    const total = started.size;
    const completedCount = Math.min(completed.size, total);
    const hasActiveToolWork = total > 0 && completedCount < total;

    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        active: isStreaming || isPending,
        value: isStreaming ? 24 : isPending ? 12 : 0,
      };
    }

    return {
      total,
      completed: completedCount,
      active: hasActiveToolWork,
      value: Math.max(8, Math.min(100, Math.round((completedCount / total) * 100))),
    };
  }, [isPending, isStreaming, messages]);

  const artifacts = useMemo<TamboArtifact[]>(() => {
    const toolNamesById = new Map<string, string>();

    messages.forEach((message) => {
      message.content.forEach((content) => {
        if (content.type === "tool_use" && typeof content.id === "string") {
          toolNamesById.set(content.id, content.name);
        }
      });
    });

    const collected: TamboArtifact[] = [];

    messages.forEach((message) => {
      message.content.forEach((content) => {
        if (content.type !== "tool_result" || typeof content.toolUseId !== "string") return;

        const toolName = toolNamesById.get(content.toolUseId);
        if (!toolName) return;

        const parsed = parseToolResultObject(getToolResultText(content));
        if (!parsed) return;

        if (toolName === "create_database_file" || typeof parsed.downloadUrl === "string" || typeof parsed.fileName === "string") {
          collected.push({
            id: content.toolUseId,
            kind: "file",
            createdAt: message.createdAt,
            ok: parsed.ok !== false,
            fileName: typeof parsed.fileName === "string" ? parsed.fileName : "export",
            format: typeof parsed.format === "string" ? parsed.format : "file",
            downloadUrl: typeof parsed.downloadUrl === "string" ? parsed.downloadUrl : undefined,
            note: typeof parsed.note === "string" ? parsed.note : undefined,
          });
          return;
        }

        if (toolName === "edit_subdomain_website") {
          collected.push({
            id: content.toolUseId,
            kind: "website",
            createdAt: message.createdAt,
            ok: parsed.ok !== false,
            applied: Boolean(parsed.applied),
            subdomain: typeof parsed.subdomain === "string" ? parsed.subdomain : undefined,
            pathUrl: typeof parsed.pathUrl === "string" ? parsed.pathUrl : undefined,
            hostUrl: typeof parsed.hostUrl === "string" ? parsed.hostUrl : undefined,
            message: typeof parsed.message === "string" ? parsed.message : undefined,
          });
        }
      });
    });

    const deduped = new Map<string, TamboArtifact>();
    collected.forEach((item) => deduped.set(`${item.kind}:${item.id}`, item));

    const ts = (value?: string) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return Array.from(deduped.values()).sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  }, [messages]);

  const renderContent = useCallback(
    (message: ThreadMessage, content: ThreadContent, index: number) => {
      if (content.type === "text") {
        return (
          <div
            key={`${message.id}:text:${index}`}
            className="whitespace-pre-wrap break-words leading-relaxed"
          >
            {content.text}
          </div>
        );
      }

      if (content.type === "component") {
        const componentId =
          typeof content.id === "string"
            ? content.id
            : `${message.id}:component:${content.name}:${index}`;

        return (
          <div key={componentId} className="space-y-2 pt-1">
            <div className={styles.componentPill}>Interactive UI: {content.name}</div>
            <TamboComponentErrorBoundary componentName={content.name}>
              <ComponentRenderer
                content={content}
                threadId={currentThreadId}
                messageId={message.id}
                fallback={
                  <div className={styles.componentFallback}>
                    Unknown component: {content.name}
                  </div>
                }
              />
            </TamboComponentErrorBoundary>
          </div>
        );
      }

      if (content.type === "tool_use") {
        return null;
      }

      if (content.type === "tool_result") {
        return null;
      }

      if (content.type === "resource") {
        return (
          <div
            key={`${message.id}:resource:${content.resource.uri}`}
            className={styles.resourceInfo}
          >
            Resource: {content.resource.uri}
          </div>
        );
      }

      return null;
    },
    [currentThreadId]
  );

  if (!apiKey) return null;

  return (
    <>
      {!isOpen ? (
        <Button
          type="button"
          className={cn("fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 h-14 w-14 rounded-2xl max-sm:right-[5.25rem]", styles.launcher)}
          onClick={() => {
            setIsOpen(true);
            setIsFullscreen(false);
          }}
          aria-label="Open AI agent"
        >
          <MessageSquare className="h-5 w-5" />
          <span aria-hidden className={styles.launcherPulse} />
        </Button>
      ) : null}

      {isOpen ? (
        <section
          role="dialog"
          aria-label={widgetLabel}
          aria-modal={isFullscreen || undefined}
          className={
            isFullscreen
              ? "fixed inset-0 z-50 p-0 sm:p-2"
              : "fixed bottom-4 right-4 z-50 h-[min(760px,calc(100vh-1.5rem))] w-[min(580px,calc(100vw-1.5rem))] max-sm:inset-x-3 max-sm:bottom-3 max-sm:top-[4.5rem] max-sm:h-auto max-sm:w-auto"
          }
        >
          <div
            className={cn(
              "flex h-full w-full min-h-0 flex-col overflow-hidden",
              isFullscreen ? "rounded-none sm:rounded-3xl" : "rounded-3xl",
              styles.widgetSurface
            )}
          >
            <div aria-hidden className={styles.widgetNoise} />

            <div
              className={cn(
                "relative z-10 flex items-center justify-between gap-2 border-b px-4 py-3",
                styles.header
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={styles.brandMark} aria-hidden>
                  <Bot className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">Tambo Agent</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span aria-hidden className={styles.statusDot} />
                    <span>{isStreaming ? "Streaming response" : "Ready"}</span>
                    {hasRealThread ? (
                      <span className={styles.threadChip}>#{currentThreadId.slice(0, 8)}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNewThread}
                  aria-label="New chat"
                  className="h-9 w-9 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen((current) => !current)}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="h-9 w-9 rounded-xl"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="h-9 w-9 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex min-h-full flex-col gap-4 p-4 sm:p-5" aria-live="polite">
                  {messages.length === 0 ? <TamboEmptyState /> : null}

                  {artifacts.length > 0 ? (
                    <section className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Artifacts panel
                        </p>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {artifacts.length}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {artifacts.map((artifact) => (
                          <div
                            key={`${artifact.kind}:${artifact.id}`}
                            className="space-y-2 rounded-xl border border-border/60 bg-background/90 p-2.5"
                          >
                            {artifact.kind === "file" ? (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{artifact.fileName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {artifact.ok ? "Generated" : "Failed"}
                                      {artifact.note ? ` - ${artifact.note}` : ""}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="shrink-0">
                                    {artifact.format.toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {artifact.downloadUrl ? (
                                    <>
                                      <a
                                        href={artifact.downloadUrl}
                                        download={artifact.fileName}
                                        className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium hover:bg-accent"
                                      >
                                        Download
                                      </a>
                                      <a
                                        href={artifact.downloadUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium hover:bg-accent"
                                      >
                                        View
                                      </a>
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Download link unavailable for this result.
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                      {artifact.subdomain ? `${artifact.subdomain} website` : "Edited website result"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {artifact.message ?? (artifact.applied ? "Update applied" : "Preview generated")}
                                    </p>
                                  </div>
                                  <Badge variant={artifact.ok ? "secondary" : "destructive"}>
                                    {artifact.ok ? "ok" : "error"}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {artifact.pathUrl ? (
                                    <a
                                      href={artifact.pathUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium hover:bg-accent"
                                    >
                                      Open preview
                                    </a>
                                  ) : null}
                                  {artifact.hostUrl ? (
                                    <a
                                      href={artifact.hostUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium hover:bg-accent"
                                    >
                                      Open host
                                    </a>
                                  ) : null}
                                </div>

                                {artifact.pathUrl ? (
                                  <div className="overflow-hidden rounded-lg border">
                                    <iframe
                                      title={artifact.subdomain ? `Site preview ${artifact.subdomain}` : "Site preview"}
                                      src={artifact.pathUrl}
                                      loading="lazy"
                                      className="h-56 w-full bg-white"
                                    />
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={cn(
                        "flex",
                        styles.messageRow,
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[92%] space-y-2 rounded-2xl px-3.5 py-3 text-sm sm:max-w-[86%]",
                          message.role === "user" ? styles.userBubble : styles.assistantBubble
                        )}
                      >
                        {message.role !== "user" ? (
                          <div className={styles.assistantLabel}>assistant</div>
                        ) : null}
                        <div className="space-y-2">
                          {message.content.map((content, idx) =>
                            renderContent(message, content, idx)
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {toolProgress.active ? (
                    <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/45 px-3 py-2.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Tambo agent progress</span>
                        <span>
                          {toolProgress.total > 0
                            ? `${toolProgress.completed}/${toolProgress.total}`
                            : "in progress"}
                        </span>
                      </div>
                      <Progress value={toolProgress.value} className="h-1.5" />
                    </div>
                  ) : null}

                  {isStreaming ? (
                    <div className={styles.streaming}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking</span>
                      <span className={styles.typingDots} aria-hidden>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  ) : null}

                  {canUseSuggestions ? (
                    <TamboSuggestionsBar disabled={isPending || isDisabled} />
                  ) : null}

                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className={cn("border-t px-3 pb-3 pt-3 sm:px-5 sm:pb-4", styles.footer)}>
                <div className={styles.composer}>
                  <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    onInput={syncTextareaHeight}
                    rows={1}
                    placeholder="Ask about stats, orders, users, or request visual cards/charts..."
                    disabled={isDisabled || isPending}
                    className="min-h-11 max-h-40 resize-none border-0 bg-transparent px-0 py-2 text-sm shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isDisabled || isPending || !hasInput}
                    aria-label="Send"
                    className={styles.sendButton}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Enter to send</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    Shift+Enter newline
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}



