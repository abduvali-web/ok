import { defineTool } from "@tambo-ai/react";
import { z } from "zod";
import { adminStatsSchema } from "@/lib/tambo/schemas";

function getOptionalBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export const getAdminStatisticsTool = defineTool({
  name: "get_admin_statistics",
  title: "Admin statistics",
  description:
    "Fetch order/customer statistics for the currently signed-in AutoFood admin.",
  annotations: {
    tamboStreamableHint: true,
  },
  inputSchema: z.object({}),
  outputSchema: adminStatsSchema,
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
      throw new Error(`Failed to fetch statistics (${response.status}). ${text}`.trim());
    }

    const data: unknown = await response.json();
    const parsed = adminStatsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid statistics response format.");
    }

    return parsed.data;
  },
});
