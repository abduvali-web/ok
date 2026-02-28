import type { TamboComponent } from "@tambo-ai/react";
import Link from "next/link";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminStatsSchema, type AdminStats } from "@/lib/tambo/schemas";

const ORDER_STATS_LABELS: Record<string, string> = {
  successfulOrders: "Доставлено",
  failedOrders: "Ошибки",
  pendingOrders: "Ожидают",
  inDeliveryOrders: "В доставке",
  pausedOrders: "На паузе",
  prepaidOrders: "Предоплата",
  unpaidOrders: "Без оплаты",
  cardOrders: "Карта",
  cashOrders: "Наличные",
  dailyCustomers: "Ежедневно",
  evenDayCustomers: "Чётные дни",
  oddDayCustomers: "Нечётные дни",
  specialPreferenceCustomers: "С особыми пожеланиями",
  orders1200: "1200 ккал",
  orders1600: "1600 ккал",
  orders2000: "2000 ккал",
  orders2500: "2500 ккал",
  orders3000: "3000 ккал",
  singleItemOrders: "1 позиция",
  multiItemOrders: "2+ позиции",
};

function orderStatsEntries(stats?: Partial<AdminStats> | null) {
  const entries: Array<[string, number | undefined]> = [];
  const safeStats = stats ?? {};

  for (const key of Object.keys(ORDER_STATS_LABELS)) {
    entries.push([key, safeStats[key as keyof AdminStats]]);
  }

  return entries;
}

function AdminStatsGrid({
  title,
  stats,
  highlightKeys,
}: {
  title?: string;
  stats?: Partial<AdminStats> | null;
  highlightKeys?: string[];
}) {
  const highlight = new Set(highlightKeys ?? []);
  const entries = orderStatsEntries(stats);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {title ?? "Статистика (админ)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-md border bg-card px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-muted-foreground">
                  {ORDER_STATS_LABELS[key] ?? key}
                </span>
                {highlight.has(key) ? (
                  <Badge variant="secondary" className="shrink-0">
                    important
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {value === undefined ? "..." : value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLinks({
  title,
  links,
}: {
  title?: string;
  links: Array<{ label: string; href: string; description?: string }>;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title ?? "Быстрые ссылки"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <Link
            key={`${link.href}:${link.label}`}
            href={link.href}
            className="block rounded-md border bg-card px-3 py-2 hover:bg-accent"
          >
            <div className="font-medium">{link.label}</div>
            {link.description ? (
              <div className="text-xs text-muted-foreground">
                {link.description}
              </div>
            ) : null}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export const tamboComponents: TamboComponent[] = [
  {
    name: "AdminStatsGrid",
    description:
      "Shows a grid of AutoFood admin statistics (orders/customers). Use after calling get_admin_statistics tool.",
    component: AdminStatsGrid,
    propsSchema: z.object({
      title: z.string().optional(),
      stats: adminStatsSchema
        .partial()
        .optional()
        .describe("Admin statistics object."),
      highlightKeys: z.array(z.string()).optional(),
    }),
  },
  {
    name: "QuickLinks",
    description:
      "Renders a list of links (navigation shortcuts) relevant to the user.",
    component: QuickLinks,
    propsSchema: z.object({
      title: z.string().optional(),
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            description: z.string().optional(),
          })
        )
        .min(1),
    }),
  },
];
