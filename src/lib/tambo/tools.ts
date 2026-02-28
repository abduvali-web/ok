import { z } from "zod";
import { adminStatsSchema } from "@/lib/tambo/schemas";
import { registerTamboTool } from "@/lib/tambo/tool-guard";

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

const siteApiRequestInputSchema = z.object({
  method: apiMethodSchema.default("GET"),
  path: z.string().min(1),
  queryParams: z.array(queryParamSchema).max(50).optional(),
  jsonBody: z.string().optional(),
});

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
  components: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
    })
  ),
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
}> = [
  { path: "/api/admin/statistics", methods: ["GET"], description: "Dashboard stats" },
  { path: "/api/admin/clients", methods: ["GET"], description: "Clients list" },
  { path: "/api/admin/clients/[id]", methods: ["GET", "PATCH"], description: "Client details/update" },
  { path: "/api/admin/clients/toggle-status", methods: ["POST"], description: "Toggle client status" },
  { path: "/api/orders", methods: ["GET", "POST"], description: "Orders list/create" },
  { path: "/api/orders/[orderId]", methods: ["GET", "PATCH"], description: "Order details/update" },
  { path: "/api/admin/orders/bulk-update", methods: ["PATCH"], description: "Bulk update orders" },
  { path: "/api/admin/orders/reorder", methods: ["PATCH"], description: "Reorder orders" },
  { path: "/api/admin/orders/delete", methods: ["DELETE"], description: "Soft delete order" },
  { path: "/api/admin/orders/restore", methods: ["POST"], description: "Restore soft-deleted order" },
  { path: "/api/admin/orders/permanent-delete", methods: ["DELETE"], description: "Permanently delete order" },
  { path: "/api/admin/couriers", methods: ["GET"], description: "Couriers list" },
  { path: "/api/admin/live-map", methods: ["GET"], description: "Live courier map data" },
  { path: "/api/admin/middle-admins", methods: ["GET", "POST"], description: "Middle admin CRUD entrypoint" },
  { path: "/api/admin/low-admins", methods: ["GET", "POST"], description: "Low admin CRUD entrypoint" },
  { path: "/api/admin/profile", methods: ["GET", "PUT"], description: "Current admin profile" },
  { path: "/api/admin/profile/change-password", methods: ["POST"], description: "Change password" },
  { path: "/api/admin/action-logs", methods: ["GET"], description: "Audit logs" },
  { path: "/api/admin/finance/company", methods: ["GET"], description: "Company finance summary" },
  { path: "/api/admin/finance/clients", methods: ["GET"], description: "Client finance summary" },
  { path: "/api/admin/finance/salary", methods: ["GET"], description: "Salary finance summary" },
  { path: "/api/admin/finance/transaction", methods: ["POST"], description: "Create finance transaction" },
  { path: "/api/admin/warehouse", methods: ["GET"], description: "Warehouse overview" },
  { path: "/api/admin/warehouse/inventory", methods: ["GET", "POST"], description: "Inventory data/update" },
  { path: "/api/admin/warehouse/ingredients", methods: ["GET", "POST"], description: "Ingredients data/update" },
  { path: "/api/admin/warehouse/dishes", methods: ["GET", "POST"], description: "Dishes data/update" },
  { path: "/api/admin/warehouse/cooking-plan", methods: ["GET"], description: "Cooking plan" },
  { path: "/api/admin/sets", methods: ["GET", "POST"], description: "Meal sets list/create" },
  { path: "/api/admin/website", methods: ["GET", "POST", "PATCH"], description: "Website builder config" },
  { path: "/api/admin/features", methods: ["GET", "POST"], description: "Feature flags/config" },
  { path: "/api/admin/menus", methods: ["GET", "POST"], description: "Menu data" },
  { path: "/api/admin/users-list", methods: ["GET"], description: "Users listing for admin panel" },
  { path: "/api/chat/conversations", methods: ["GET", "POST"], description: "Internal chat conversations" },
  { path: "/api/chat/messages", methods: ["GET", "POST", "PATCH"], description: "Internal chat messages" },
  { path: "/api/courier/orders", methods: ["GET"], description: "Courier orders" },
  { path: "/api/courier/stats", methods: ["GET"], description: "Courier statistics" },
  { path: "/api/courier/profile", methods: ["GET"], description: "Courier profile" },
  { path: "/api/system/auto-scheduler", methods: ["POST"], description: "Run auto scheduler" },
  { path: "/api/health", methods: ["GET"], description: "Health check" },
];

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
    const parsedInput = siteApiRequestInputSchema.safeParse(input);
    if (!parsedInput.success) {
      throw new Error(
        "Invalid site_api_request input. Required: method and path starting with /api/."
      );
    }

    const { method, path, queryParams, jsonBody } = parsedInput.data;
    const safeMethod = method ?? "GET";

    const requestPath = buildRelativeApiUrl(path, queryParams);
    const token = getOptionalBearerToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let body: string | undefined;
    if (jsonBody && safeMethod !== "GET") {
      try {
        JSON.parse(jsonBody);
      } catch {
        throw new Error("jsonBody must be a valid JSON string.");
      }
      headers["Content-Type"] = "application/json";
      body = jsonBody;
    }

    const response = await fetch(requestPath, {
      method: safeMethod,
      credentials: "include",
      headers,
      ...(body ? { body } : {}),
    });

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
      path: requestPath,
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
      pages: [
        { path: "/middle-admin", purpose: "Main middle admin dashboard" },
        { path: "/middle-admin/database", purpose: "Database workspace + AI panel" },
        { path: "/super-admin", purpose: "Super admin console" },
        { path: "/low-admin", purpose: "Low admin workspace" },
        { path: "/courier", purpose: "Courier app interface" },
      ],
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
