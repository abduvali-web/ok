"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ComponentRenderer,
  useTambo,
  useTamboSuggestions,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { Bot, Loader2, MessageSquare, Plus, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function TamboSuggestionsBar({ disabled }: { disabled: boolean }) {
  const { suggestions, accept, isFetching } = useTamboSuggestions({
    maxSuggestions: 3,
  });

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {suggestions.map((s) => (
        <Button
          key={s.id}
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => accept({ suggestion: s })}
          disabled={disabled || isFetching}
          title={s.detailedSuggestion}
        >
          {s.title ?? "Suggestion"}
        </Button>
      ))}
    </div>
  );
}

function isAdminRoute(pathname: string) {
  return (
    pathname.startsWith("/middle-admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/low-admin")
  );
}

export function TamboAgentWidget() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const enableSuggestions =
    process.env.NEXT_PUBLIC_TAMBO_ENABLE_SUGGESTIONS === "true";
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const canShow = useMemo(() => {
    if (!apiKey) return false;
    if (!pathname) return false;
    return isAdminRoute(pathname);
  }, [apiKey, pathname]);

  useEffect(() => {
    if (!isOpen) return;
    initThread(currentThreadId);
  }, [isOpen, initThread, currentThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!canShow) return null;
  const hasRealThread = currentThreadId !== "placeholder";
  const canUseSuggestions =
    enableSuggestions && isIdentified && hasRealThread;

  const handleSend = async () => {
    if (!value.trim() || isDisabled) return;
    const result = await submit();
    if (result.threadId && result.threadId !== currentThreadId) {
      initThread(result.threadId);
    }
  };

  const handleNewThread = () => {
    startNewThread();
  };

  return (
    <>
      {/* Toggle button */}
      {!isOpen ? (
        <Button
          type="button"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI agent"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      ) : null}

      {/* Panel */}
      {isOpen ? (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" />
                Tambo Agent
                {isStreaming ? (
                  <Badge variant="secondary" className="ml-2">
                    streaming
                  </Badge>
                ) : null}
              </CardTitle>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNewThread}
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <div className="space-y-3 p-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="space-y-2">
                          {message.content.map((content, idx) => {
                            if (content.type === "text") {
                              return (
                                <div key={`${message.id}:t:${idx}`}>
                                  {content.text}
                                </div>
                              );
                            }

                            if (content.type === "component") {
                              return (
                                <div key={content.id} className="pt-1">
                                  <ComponentRenderer
                                    content={content}
                                    threadId={currentThreadId}
                                    messageId={message.id}
                                    fallback={
                                      <div className="text-xs text-muted-foreground">
                                        Unknown component: {content.name}
                                      </div>
                                    }
                                  />
                                </div>
                              );
                            }

                            if (content.type === "tool_use") {
                              return (
                                <div
                                  key={`${message.id}:tool:${content.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  {content.statusMessage ??
                                    `Running tool: ${content.name}`}
                                </div>
                              );
                            }

                            if (content.type === "tool_result") {
                              return (
                                <div
                                  key={`${message.id}:toolr:${content.toolUseId}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Tool result received
                                </div>
                              );
                            }

                            if (content.type === "resource") {
                              return (
                                <div
                                  key={`${message.id}:res:${content.resource.uri}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Resource: {content.resource.uri}
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isStreaming ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </div>
                  ) : null}

                  {/* Suggestions are opt-in because some Tambo projects return 403 for suggestions endpoints. */}
                  {canUseSuggestions ? (
                    <TamboSuggestionsBar disabled={isPending || isDisabled} />
                  ) : null}

                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSend();
                    }}
                    placeholder="Напишите сообщение…"
                    disabled={isDisabled || isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isDisabled || isPending || !value.trim()}
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
