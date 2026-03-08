"use client";

import { useEffect, useMemo, useState } from "react";
import {
  currentTimeContextHelper,
  TamboProvider,
  TamboThreadInputProvider,
} from "@tambo-ai/react";
import { MessageSquare } from "lucide-react";

import { tamboComponents } from "@/lib/tambo/components";
import {
  buildInteractiveUiTool,
  createDatabaseFileTool,
  editSubdomainWebsiteTool,
  getAdminStatisticsTool,
  siteApiCatalogTool,
  siteApiRequestTool,
  siteUiCatalogTool,
} from "@/lib/tambo/tools";
import { TamboAgentWidget } from "@/components/tambo/TamboAgentWidget";
import { Button } from "@/components/ui/button";
import { getJsonFromLocalStorage } from "@/lib/browser-storage";

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
  const user = getJsonFromLocalStorage<{ id?: unknown }>("user");
  if (typeof user?.id === "string" && user.id.length > 0) return user.id;
  return getStableAnonKey();
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
      buildInteractiveUiTool,
      createDatabaseFileTool,
      editSubdomainWebsiteTool,
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
      }}
      initialMessages={[
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "You are AutoFood admin AI in strict generative UI mode. Workflow: use site_api_catalog and site_ui_catalog first, call site_api_request for live data, then call build_interactive_ui to transform payloads into component-ready props before rendering. Build responses only with AdminStatsGrid, SiteMetricGrid, SiteDataTable, SiteEntityCards, SiteBarChart, QuickLinks, and SiteJsonPanel. Never embed, mirror, or copy full site pages; compose original interactive UI from data and components. For downloadable outputs, call create_database_file and always return downloadUrl with fileName/format. For subdomain work, call edit_subdomain_website with explicit mode (full_rebuild, merge_existing, or section_patch), include sections/siteName/styleVariant/subdomain when relevant, and report resulting pathUrl and hostUrl. Prefer dense table-first layouts, concise summaries, and minimal action controls.",
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
