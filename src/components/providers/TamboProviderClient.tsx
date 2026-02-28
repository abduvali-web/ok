"use client";

import { useEffect, useMemo, useState } from "react";
import {
  currentPageContextHelper,
  currentTimeContextHelper,
  TamboProvider,
  TamboThreadInputProvider,
} from "@tambo-ai/react";

import { tamboComponents } from "@/lib/tambo/components";
import {
  getAdminStatisticsTool,
  siteApiCatalogTool,
  siteApiRequestTool,
  siteUiCatalogTool,
} from "@/lib/tambo/tools";
import { TamboAgentWidget } from "@/components/tambo/TamboAgentWidget";

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

  if (!apiKey) return <>{children}</>;

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
              text: "You are AutoFood admin AI. Use site_api_catalog and site_ui_catalog first, then use site_api_request for live data (GET/POST/PUT/PATCH/DELETE). Render responses with AdminStatsGrid, SiteMetricGrid, SiteDataTable, SiteEntityCards, QuickLinks, SiteJsonPanel, and SiteRouteEmbed.",
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
