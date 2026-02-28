"use client";

import { useEffect, useMemo, useState } from "react";
import {
  currentPageContextHelper,
  currentTimeContextHelper,
  TamboProvider,
  TamboThreadInputProvider,
} from "@tambo-ai/react";
import { MessageSquare } from "lucide-react";

import { tamboComponents } from "@/lib/tambo/components";
import {
  getAdminStatisticsTool,
  siteApiCatalogTool,
  siteApiRequestTool,
  siteUiCatalogTool,
} from "@/lib/tambo/tools";
import { TamboAgentWidget } from "@/components/tambo/TamboAgentWidget";
import { Button } from "@/components/ui/button";

function getStableAnonKey(): string {
  if (typeof window === "undefined") return "anonymous";
  const existing = localStorage.getItem("tambo_anon_user_key");
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem("tambo_anon_user_key", created);
  return created;
}

function getUserKeyFromStorage(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return getStableAnonKey();
    const parsed = JSON.parse(raw) as { id?: string } | null;
    if (parsed?.id && typeof parsed.id === "string") return parsed.id;
    return getStableAnonKey();
  } catch {
    return getStableAnonKey();
  }
}

export function TamboProviderClient({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const [userKey, setUserKey] = useState("anonymous");

  useEffect(() => {
    setUserKey(getUserKeyFromStorage());
  }, []);

  const tools = useMemo(
    () => [
      getAdminStatisticsTool,
      siteApiCatalogTool,
      siteUiCatalogTool,
      siteApiRequestTool,
    ],
    []
  );

  if (!apiKey) {
    return (
      <>
        {children}
        <Button
          type="button"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => {
            window.alert(
              "Set NEXT_PUBLIC_TAMBO_API_KEY and restart/redeploy to enable chat."
            );
          }}
          aria-label="Open AI agent setup hint"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </>
    );
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      userKey={userKey}
      components={tamboComponents}
      tools={tools}
      contextHelpers={{
        current_time: currentTimeContextHelper,
        current_page: currentPageContextHelper,
      }}
      initialMessages={[
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "You are AutoFood admin AI. Use site_api_catalog and site_ui_catalog first, then use site_api_request for live data (GET/POST/PUT/PATCH/DELETE). You may use any real /api route from catalog, including mutation routes (salary, courier/admin/client/order updates). For full interactive native UI, use SiteRouteEmbed with routes from site_ui_catalog pages. Render responses with AdminStatsGrid, SiteMetricGrid, SiteDataTable, SiteEntityCards, SiteBarChart, QuickLinks, SiteJsonPanel, and SiteRouteEmbed. Prefer SiteBarChart when the user asks for chart/graph visualization.",
            },
          ],
        },
      ]}
    >
      <TamboThreadInputProvider>
        {children}
        <TamboAgentWidget />
      </TamboThreadInputProvider>
    </TamboProvider>
  );
}
