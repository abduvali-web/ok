import { z } from "zod";
import { adminStatsSchema } from "@/lib/tambo/schemas";
import { registerTamboTool } from "@/lib/tambo/tool-guard";
import { SITE_ENDPOINT_CATALOG as GENERATED_SITE_ENDPOINT_CATALOG } from "@/lib/tambo/api-catalog.generated";
import {
  SITE_UI_COMPONENT_CATALOG,
  SITE_UI_PAGE_CATALOG,
} from "@/lib/tambo/ui-catalog.generated";

function getOptionalBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

const queryParamSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const apiMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const siteApiResponseSchema = z.object({
  ok: z.boolean(),
  method: apiMethodSchema,
  path: z.string(),
  status: z.number(),
  body: z.string().optional(),
  error: z.string().optional(),
});

const siteApiRequestInputSchema = z
  .object({
    method: apiMethodSchema.optional(),
    path: z.string().optional(),
    queryParams: z.array(queryParamSchema).max(50).optional(),
    jsonBody: z.string().optional(),
  })
  .strict();

const siteApiCatalogSchema = z.object({
  title: z.string(),
  endpoints: z.array(
    z.object({
      path: z.string(),
      methods: z.array(apiMethodSchema),
      description: z.string(),
    })
  ),
});

const siteUiCatalogSchema = z.object({
  title: z.string(),
  notes: z.array(z.string()).optional(),
  components: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
    })
  ),
  siteComponents: z
    .array(
      z.object({
        name: z.string(),
        purpose: z.string(),
        source: z.string(),
      })
    )
    .optional(),
  pages: z.array(
    z.object({
      path: z.string(),
      purpose: z.string(),
    })
  ),
});

const SITE_ENDPOINT_CATALOG: Array<{
  path: string;
  methods: Array<z.infer<typeof apiMethodSchema>>;
  description: string;
}> = GENERATED_SITE_ENDPOINT_CATALOG.map((endpoint) => ({
  path: endpoint.path,
  methods: [...endpoint.methods] as Array<z.infer<typeof apiMethodSchema>>,
  description: endpoint.description,
}));

function buildRelativeApiUrl(
  path: string,
  queryParams?: Array<z.infer<typeof queryParamSchema>>
) {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/api/")) {
    throw new Error("Path must start with /api/.");
  }
  if (trimmed.includes("://") || trimmed.startsWith("//") || trimmed.includes("..")) {
    throw new Error("Only safe relative API paths are allowed.");
  }
  const url = new URL(trimmed, window.location.origin);
  for (const param of queryParams ?? []) {
    url.searchParams.append(param.key, param.value);
  }
  return `${url.pathname}${url.search}`;
}

function truncateForModel(text: string, max = 12000) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...[truncated]`;
}

export const getAdminStatisticsTool = registerTamboTool({
  name: "get_admin_statistics",
  title: "Admin statistics",
  description:
    "Fetch order/customer statistics for the currently signed-in AutoFood admin.",
  annotations: {
    tamboStreamableHint: true,
  },
  inputSchema: z.object({}),
  outputSchema: adminStatsSchema,
  defaultMessage: "Failed to fetch admin statistics.",
  tool: async () => {
    const token = getOptionalBearerToken();
    const response = await fetch("/api/admin/statistics", {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Not authenticated. Please log in to the admin panel.");
      }

      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch statistics (${response.status}). ${text}`.trim()
      );
    }

    const data: unknown = await response.json();
    const parsed = adminStatsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid statistics response format.");
    }

    return parsed.data;
  },
});

export const siteApiRequestTool = registerTamboTool({
  name: "site_api_request",
  title: "Site API request",
  description:
    "Call most site API routes. Supports GET/POST/PUT/PATCH/DELETE for relative /api/* paths.",
  // Keep this non-streamable: partial streaming tool args can break URL/input validation.
  annotations: {},
  inputSchema: siteApiRequestInputSchema,
  outputSchema: siteApiResponseSchema,
  defaultMessage: "Site API request failed.",
  tool: async (input) => {
    const rawInput =
      input && typeof input === "object"
        ? (input as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const safeMethod = apiMethodSchema.safeParse(rawInput.method).success
      ? (rawInput.method as z.infer<typeof apiMethodSchema>)
      : "GET";
    const rawPath = typeof rawInput.path === "string" ? rawInput.path : "";
    const safeQueryParams = Array.isArray(rawInput.queryParams)
      ? rawInput.queryParams
          .map((item) => queryParamSchema.safeParse(item))
          .filter((item) => item.success)
          .map((item) => item.data)
      : undefined;
    const jsonBody = typeof rawInput.jsonBody === "string" ? rawInput.jsonBody : undefined;

    if (!rawPath.trim()) {
      return {
        ok: false,
        method: safeMethod,
        path: "/api/invalid",
        status: 400,
        error:
          "Invalid site_api_request input. Required: method and path starting with /api/.",
      };
    }

    let requestPath = rawPath;
    try {
      requestPath = buildRelativeApiUrl(rawPath, safeQueryParams);
    } catch (error) {
      return {
        ok: false,
        method: safeMethod,
        path: rawPath,
        status: 400,
        error: error instanceof Error ? error.message : "Invalid API path.",
      };
    }

    const courierByIdMatch = requestPath.match(/^\/api\/admin\/couriers\/([^/?#]+)$/);
    let normalizedPath = requestPath;
    let normalizedJsonBody = jsonBody;

    if (courierByIdMatch) {
      if (safeMethod !== "PATCH") {
        return {
          ok: false,
          method: safeMethod,
          path: requestPath,
          status: 400,
          error:
            "Unsupported courier-by-id route. Use /api/admin/couriers. For updates, call PATCH /api/admin/couriers with courierId in JSON body.",
        };
      }

      normalizedPath = "/api/admin/couriers";

      let payload: Record<string, unknown> = {};
      if (jsonBody) {
        try {
          const parsedPayload: unknown = JSON.parse(jsonBody);
          if (
            parsedPayload &&
            typeof parsedPayload === "object" &&
            !Array.isArray(parsedPayload)
          ) {
            payload = parsedPayload as Record<string, unknown>;
          }
        } catch {
          return {
            ok: false,
            method: safeMethod,
            path: requestPath,
            status: 400,
            error: "jsonBody must be a valid JSON string.",
          };
        }
      }

      if (typeof payload.courierId !== "string" || payload.courierId.trim().length === 0) {
        payload.courierId = decodeURIComponent(courierByIdMatch[1]);
      }
      normalizedJsonBody = JSON.stringify(payload);
    }

    const token = getOptionalBearerToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let body: string | undefined;
    if (normalizedJsonBody && safeMethod !== "GET") {
      try {
        JSON.parse(normalizedJsonBody);
      } catch {
        return {
          ok: false,
          method: safeMethod,
          path: normalizedPath,
          status: 400,
          error: "jsonBody must be a valid JSON string.",
        };
      }
      headers["Content-Type"] = "application/json";
      body = normalizedJsonBody;
    }

    let response: Response;
    try {
      response = await fetch(normalizedPath, {
        method: safeMethod,
        credentials: "include",
        headers,
        ...(body ? { body } : {}),
      });
    } catch (error) {
      return {
        ok: false,
        method: safeMethod,
        path: normalizedPath,
        status: 502,
        error:
          error instanceof Error
            ? `Network/request error: ${error.message}`
            : "Network/request error.",
      };
    }

    const rawText = await response.text().catch(() => "");
    let normalized = rawText;
    if (rawText) {
      try {
        normalized = JSON.stringify(JSON.parse(rawText), null, 2);
      } catch {
        normalized = rawText;
      }
    }

    const safeBody = normalized ? truncateForModel(normalized) : undefined;

    return {
      ok: response.ok,
      method: safeMethod,
      path: normalizedPath,
      status: response.status,
      ...(safeBody ? { body: safeBody } : {}),
      ...(!response.ok ? { error: `Request failed with status ${response.status}` } : {}),
    };
  },
});

export const siteUiCatalogTool = registerTamboTool({
  name: "site_ui_catalog",
  title: "Site UI catalog",
  description:
    "Returns render components and key site pages the agent can use for UI responses.",
  annotations: {
    tamboStreamableHint: true,
  },
  inputSchema: z.object({}),
  outputSchema: siteUiCatalogSchema,
  defaultMessage: "Failed to load UI catalog.",
  tool: async () => {
    return {
      title: "AutoFood UI catalog",
      notes: [
        "Use SiteRouteEmbed to render native site pages interactively (forms, tables, controls).",
        "Use components list for Tambo-renderable cards/tables/charts inside chat.",
      ],
      components: [
        { name: "AdminStatsGrid", purpose: "Order and customer stats cards" },
        { name: "SiteMetricGrid", purpose: "KPI dashboard cards" },
        { name: "SiteDataTable", purpose: "Tabular data with typed columns/cells" },
        { name: "SiteEntityCards", purpose: "Client/order/courier cards with statuses" },
        { name: "SiteBarChart", purpose: "Simple bar chart for counts and comparisons" },
        { name: "QuickLinks", purpose: "Navigation shortcuts" },
        { name: "SiteJsonPanel", purpose: "Raw API payload view" },
        { name: "SiteRouteEmbed", purpose: "Embed any internal route in an iframe" },
      ],
      siteComponents: SITE_UI_COMPONENT_CATALOG.map((component) => ({
        name: component.name,
        purpose: component.purpose,
        source: component.source,
      })),
      pages: SITE_UI_PAGE_CATALOG.map((page) => ({
        path: page.path,
        purpose: page.purpose,
      })),
    };
  },
});

export const siteApiCatalogTool = registerTamboTool({
  name: "site_api_catalog",
  title: "Site API catalog",
  description:
    "Get the main API routes of the site with method hints, then use site_api_request.",
  annotations: {
    tamboStreamableHint: true,
  },
  inputSchema: z.object({}),
  outputSchema: siteApiCatalogSchema,
  defaultMessage: "Failed to load API catalog.",
  tool: async () => {
    return {
      title: "AutoFood API catalog",
      endpoints: SITE_ENDPOINT_CATALOG,
    };
  },
});
