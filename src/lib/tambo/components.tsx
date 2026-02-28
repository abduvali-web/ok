import type { TamboComponent } from "@tambo-ai/react";
import Link from "next/link";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function orderStatsEntries(stats: Record<string, number>) {
  const known: Array<[string, number]> = [];
  const unknown: Array<[string, number]> = [];

  for (const [key, value] of Object.entries(stats)) {
    if (ORDER_STATS_LABELS[key]) known.push([key, value]);
    else unknown.push([key, value]);
  }

  known.sort((a, b) => a[0].localeCompare(b[0]));
  unknown.sort((a, b) => a[0].localeCompare(b[0]));
  return [...known, ...unknown];
}

function AdminStatsGrid({
  title,
  stats,
  highlightKeys,
}: {
  title?: string;
  stats: Record<string, number>;
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
                {value}
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
      stats: z
        .record(z.string(), z.number())
        .describe("Map of statKey -> numeric value."),
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
