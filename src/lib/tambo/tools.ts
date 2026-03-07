import { z } from "zod";
import { adminStatsSchema } from "@/lib/tambo/schemas";
import { registerTamboTool } from "@/lib/tambo/tool-guard";
import { SITE_ENDPOINT_CATALOG as GENERATED_SITE_ENDPOINT_CATALOG } from "@/lib/tambo/api-catalog.generated";

function getOptionalBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

const queryParamSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const apiMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const fileFormatSchema = z.enum(["csv", "json", "txt", "html", "pdf", "xlsx"]);

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

const fileExportInputSchema = z
  .object({
    fileName: z.string().min(1).max(100),
    format: fileFormatSchema,
    sourcePath: z.string().optional(),
    method: apiMethodSchema.optional(),
    queryParams: z.array(queryParamSchema).max(50).optional(),
    jsonBody: z.string().optional(),
    instructions: z.string().max(4000).optional(),
  })
  .strict();

const fileExportOutputSchema = z.object({
  ok: z.boolean(),
  fileName: z.string(),
  format: fileFormatSchema,
  downloadUrl: z.string().optional(),
  note: z.string().optional(),
  error: z.string().optional(),
});

const websiteEditInputSchema = z
  .object({
    prompt: z.string().min(10).max(4000).optional(),
    apply: z.boolean().optional(),
    // Explicitly allow known execution metadata keys.
    status: z.string().optional(),
    completion: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .strip();

const websiteEditOutputSchema = z.object({
  ok: z.boolean(),
  applied: z.boolean(),
  subdomain: z.string().optional(),
  pathUrl: z.string().optional(),
  hostUrl: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
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
  notes: z.array(z.string()).optional(),
  components: z.array(
    z.object({
      name: z.string(),
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

function normalizeFileName(name: string, extension: string) {
  const clean = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  const base = clean.length > 0 ? clean : `export-${Date.now()}`;
  if (base.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
    return base;
  }
  return `${base}.${extension}`;
}

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (!/[",\n]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

function jsonToCsv(data: unknown): string {
  if (!Array.isArray(data)) {
    if (data && typeof data === "object") {
      return "key,value\n" + Object.entries(data as Record<string, unknown>)
        .map(([key, value]) => `${csvEscape(key)},${csvEscape(value)}`)
        .join("\n");
    }
    return `value\n${csvEscape(data)}`;
  }

  if (data.length === 0) return "empty\n";

  const objectRows = data.filter((item) => item && typeof item === "object" && !Array.isArray(item)) as Array<Record<string, unknown>>;
  if (objectRows.length !== data.length) {
    return "value\n" + data.map((item) => csvEscape(item)).join("\n");
  }

  const headerSet = new Set<string>();
  objectRows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  const lines = [headers.map((header) => csvEscape(header)).join(",")];
  objectRows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  });

  return lines.join("\n");
}

function toTextSnapshot(payload: unknown, instructions?: string): string {
  const blocks: string[] = [];

  if (instructions && instructions.trim().length > 0) {
    blocks.push(`Instructions: ${instructions.trim()}`);
    blocks.push("");
  }

  if (typeof payload === "string") {
    blocks.push(payload);
  } else {
    blocks.push(JSON.stringify(payload ?? {}, null, 2));
  }

  return blocks.join("\n");
}

function buildHtmlReport(title: string, textContent: string): string {
  const escaped = textContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #111827; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  pre { white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; line-height: 1.45; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${escaped}</pre>
</body>
</html>`;
}

function pdfEscapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdfBytes(text: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const lines = text
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .split(/\r?\n/)
    .map((line) => line.slice(0, 110))
    .slice(0, 120);

  const streamParts = ["BT", "/F1 10 Tf", "14 TL", "72 800 Td"];
  lines.forEach((line, index) => {
    if (index > 0) streamParts.push("T*");
    streamParts.push(`(${pdfEscapeText(line)}) Tj`);
  });
  streamParts.push("ET");
  const stream = streamParts.join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${encoder.encode(stream).length} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const objectText of objects) {
    offsets.push(pdf.length);
    pdf += `${objectText}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return encoder.encode(pdf).buffer as ArrayBuffer;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to encode file for download."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read generated file."));
    reader.readAsDataURL(blob);
  });
}

async function fetchApiPayload(options: {
  path: string;
  method: z.infer<typeof apiMethodSchema>;
  queryParams?: Array<z.infer<typeof queryParamSchema>>;
  jsonBody?: string;
}): Promise<unknown> {
  const requestPath = buildRelativeApiUrl(options.path, options.queryParams);
  const token = getOptionalBearerToken();

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body: string | undefined;
  if (options.jsonBody && options.method !== "GET") {
    JSON.parse(options.jsonBody);
    headers["Content-Type"] = "application/json";
    body = options.jsonBody;
  }

  const response = await fetch(requestPath, {
    method: options.method,
    credentials: "include",
    headers,
    ...(body ? { body } : {}),
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`API source request failed (${response.status}) ${raw}`.trim());
  }

  if (contentType.includes("application/json")) {
    return raw ? JSON.parse(raw) : {};
  }

  return raw;
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

export const createDatabaseFileTool = registerTamboTool({
  name: "create_database_file",
  title: "Create database file",
  description:
    "Create downloadable files (CSV, JSON, TXT, HTML, PDF, XLSX fallback) from live API data and user instructions.",
  annotations: {},
  inputSchema: fileExportInputSchema,
  outputSchema: fileExportOutputSchema,
  defaultMessage: "Failed to create file export.",
  tool: async (input) => {
    try {
      const safeInput = fileExportInputSchema.parse(input);
      const sourcePath = safeInput.sourcePath?.trim();
      const apiMethod = safeInput.method ?? "GET";

      let payload: unknown = {
        note: "No sourcePath provided. File generated from instructions only.",
      };

      if (sourcePath) {
        payload = await fetchApiPayload({
          path: sourcePath,
          method: apiMethod,
          queryParams: safeInput.queryParams,
          jsonBody: safeInput.jsonBody,
        });
      }

      const textSnapshot = toTextSnapshot(payload, safeInput.instructions);
      const requestedFormat = safeInput.format;

      let blob: Blob;
      let fileExtension = requestedFormat;
      let note = "";

      if (requestedFormat === "json") {
        blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
      } else if (requestedFormat === "csv") {
        blob = new Blob([jsonToCsv(payload)], { type: "text/csv;charset=utf-8;" });
      } else if (requestedFormat === "txt") {
        blob = new Blob([textSnapshot], { type: "text/plain;charset=utf-8;" });
      } else if (requestedFormat === "html") {
        blob = new Blob([buildHtmlReport(safeInput.fileName, textSnapshot)], { type: "text/html;charset=utf-8;" });
      } else if (requestedFormat === "pdf") {
        blob = new Blob([createSimplePdfBytes(textSnapshot)], { type: "application/pdf" });
      } else {
        fileExtension = "csv";
        note = "XLSX requested. Generated CSV fallback for compatibility.";
        blob = new Blob([jsonToCsv(payload)], { type: "text/csv;charset=utf-8;" });
      }

      const fileName = normalizeFileName(safeInput.fileName, fileExtension);
      const downloadUrl = await blobToDataUrl(blob);

      return {
        ok: true,
        fileName,
        format: requestedFormat,
        downloadUrl,
        ...(note ? { note } : {}),
      };
    } catch (error) {
      return {
        ok: false,
        fileName: "export-error.txt",
        format: "txt" as const,
        error: error instanceof Error ? error.message : "Failed to create export file.",
      };
    }
  },
});

export const editSubdomainWebsiteTool = registerTamboTool({
  name: "edit_subdomain_website",
  title: "Edit subdomain website",
  description:
    "Generate and apply subdomain website content from a natural-language prompt.",
  annotations: {},
  inputSchema: websiteEditInputSchema,
  outputSchema: websiteEditOutputSchema,
  defaultMessage: "Failed to update subdomain website.",
  tool: async (input) => {
    const payload = websiteEditInputSchema.parse(input);
    const rawInput =
      input && typeof input === "object"
        ? (input as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const promptCandidates = [
      payload.prompt,
      typeof rawInput.prompt === "string" ? rawInput.prompt : undefined,
      typeof rawInput.request === "string" ? rawInput.request : undefined,
      typeof rawInput.instruction === "string" ? rawInput.instruction : undefined,
      typeof rawInput.task === "string" ? rawInput.task : undefined,
      typeof rawInput.message === "string" ? rawInput.message : undefined,
    ];

    const prompt =
      promptCandidates.find((candidate) => typeof candidate === "string" && candidate.trim().length >= 10)?.trim() || "";

    if (!prompt) {
      return {
        ok: false,
        applied: false,
        message: "Website update failed.",
        error: "Prompt is required (min 10 characters).",
      };
    }

    const token = getOptionalBearerToken();

    const response = await fetch("/api/admin/website/ai-edit", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        apply: payload.apply ?? true,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        applied: false,
        message: "Website update failed.",
        error: typeof data?.error === "string" ? data.error : `Request failed (${response.status})`,
      };
    }

    return {
      ok: true,
      applied: Boolean(data?.applied),
      subdomain: typeof data?.website?.subdomain === "string" ? data.website.subdomain : undefined,
      pathUrl: typeof data?.urls?.pathUrl === "string" ? data.urls.pathUrl : undefined,
      hostUrl: typeof data?.urls?.hostUrl === "string" ? data.urls.hostUrl : undefined,
      message:
        typeof data?.message === "string"
          ? data.message
          : "Subdomain website updated successfully.",
    };
  },
});

export const siteUiCatalogTool = registerTamboTool({
  name: "site_ui_catalog",
  title: "Site UI catalog",
  description:
    "Returns approved generative UI components for in-chat rendering.",
  annotations: {
    tamboStreamableHint: true,
  },
  inputSchema: z.object({}),
  outputSchema: siteUiCatalogSchema,
  defaultMessage: "Failed to load UI catalog.",
  tool: async () => {
    return {
      title: "AutoFood generative UI catalog",
      notes: [
        "Do not embed or mirror full site pages.",
        "Build UI only from these components and live data from site_api_request.",
        "Prefer dense, table-first layouts and minimal action controls.",
      ],
      components: [
        { name: "AdminStatsGrid", purpose: "Order and customer stats cards" },
        { name: "SiteMetricGrid", purpose: "KPI dashboard cards" },
        { name: "SiteDataTable", purpose: "Tabular data with typed columns/cells" },
        { name: "SiteEntityCards", purpose: "Client/order/courier cards with statuses" },
        { name: "SiteBarChart", purpose: "Simple bar chart for counts and comparisons" },
        { name: "QuickLinks", purpose: "Navigation shortcuts" },
        { name: "SiteJsonPanel", purpose: "Raw API payload view" },
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
