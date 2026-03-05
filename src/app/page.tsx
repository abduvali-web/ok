'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  ChartColumnIncreasing,
  Check,
  Clock3,
  Gauge,
  Phone,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const operatingMetrics = [
  {
    value: '12 min',
    label: 'Dispatch response window',
    detail: 'Live routing and courier balancing keep queues moving during peak lunch hours.',
  },
  {
    value: '94%',
    label: 'On-time fulfillment',
    detail: 'Operators see route, kitchen, warehouse, and debt pressure in one command surface.',
  },
  {
    value: '4 roles',
    label: 'Coordinated teams',
    detail: 'Super admin, middle admin, low admin, and courier tools stay aligned in real time.',
  },
]

const features = [
  {
    icon: Zap,
    title: 'Auto Order Engine',
    desc: 'Recurring plans, zone schedules, and exception handling for subscription-style delivery.',
  },
  {
    icon: Route,
    title: 'Dispatch Control',
    desc: 'See active couriers, route drift, and backlog pressure before service degrades.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Finance Visibility',
    desc: 'Track revenue, salaries, debts, ingredient buying, and operational margin in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Role Governance',
    desc: 'Permission-aware workflows ensure each team member sees only the controls they need.',
  },
]

const workflows = [
  {
    title: 'Morning launch',
    detail: 'Prep demand, cooking plan, inventory status, and courier readiness before the first wave goes out.',
    icon: Clock3,
  },
  {
    title: 'Peak-hour command',
    detail: 'Track live orders, rebalance routes, and detect operational bottlenecks while customers are still waiting.',
    icon: Gauge,
  },
  {
    title: 'End-of-day review',
    detail: 'Reconcile revenue, salary costs, failed deliveries, and warehouse movement without exporting spreadsheets.',
    icon: Target,
  },
]

const controlGrid = [
  'Unlimited orders and client records',
  'Courier mobile workflow',
  'Warehouse and cooking planning',
  'Debt and salary accounting',
  'AI-assisted site and client flows',
  'Role-based operational access',
  'Route optimization controls',
  'Live map and dispatch visibility',
]

const proofStrip = [
  { label: 'Orders', value: '58k/day' },
  { label: 'Dispatch speed', value: '+46%' },
  { label: 'Admin clarity', value: '7 tabs unified' },
]

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-command-center opacity-90" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_58%)]" />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07111d]/78 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-[11px] font-bold uppercase tracking-[0.28em] text-white">
              AF
            </span>
            <span>
              <span className="block font-display text-lg tracking-tight">AutoFood</span>
              <span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Operations command</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-full border border-white/10 bg-white/6 px-2 py-1">
              <LanguageSwitcher />
            </div>
            <Link href="/login">
              <Button size="sm" className="rounded-full bg-[#f3efe6] px-5 text-[#08111d] hover:bg-white">
                {t.common.login}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              <Sparkles className="h-3.5 w-3.5" />
              Info-rich delivery operating system
            </div>

            <div className="mt-8 max-w-4xl">
              <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl lg:text-8xl">
                Professional control for
                <span className="mt-2 block text-[#f3c887]">complex food delivery operations.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                AutoFood combines dispatch, warehouse planning, finance, client subscriptions, and role-based execution into a single operating surface built for teams that need speed, clarity, and accountability.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="rounded-full bg-[#f3efe6] px-8 text-base font-semibold text-[#08111d] shadow-[0_20px_60px_-28px_rgba(243,239,230,0.75)] hover:bg-white">
                  Open Dashboard
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="tel:+998977087373">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/15 bg-white/6 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  +998 97 708 73 73
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {operatingMetrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className={`glass-card-dark animate-fade-in-up rounded-[1.75rem] p-5 stagger-${index + 2}`}
                >
                  <p className="text-3xl font-semibold tracking-tight text-white">{metric.value}</p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-[#f3c887]">{metric.label}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="animate-scale-in rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.92),rgba(9,18,33,0.82))] p-5 text-white shadow-[0_35px_90px_-48px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Live control room</p>
                <h2 className="mt-2 font-display text-2xl tracking-tight">Today at a glance</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-200">
                System stable
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Active couriers</p>
                  <Truck className="h-4 w-4 text-[#f3c887]" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-4xl font-semibold">18</p>
                  <p className="text-sm text-emerald-300">+3 available</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#f3c887,#7dd3fc)]" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Orders in motion</p>
                  <p className="mt-3 text-3xl font-semibold">247</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lunch wave monitoring</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Warehouse risk</p>
                  <p className="mt-3 text-3xl font-semibold">Low</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-300">Stock aligned with forecast</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Operational lanes</p>
                  <Blocks className="h-4 w-4 text-[#f3c887]" />
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['Dispatch', 'Healthy throughput', '86%'],
                    ['Finance', 'Debt review pending', '61%'],
                    ['Kitchen', 'Prep schedule aligned', '78%'],
                  ].map(([name, status, fill]) => (
                    <div key={name}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{name}</span>
                        <span className="text-white/50">{fill}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{status}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc,#f3c887)]" style={{ width: fill }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 animate-fade-in-up rounded-[2rem] border border-white/10 bg-white/6 p-4 text-white backdrop-blur-xl sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            {proofStrip.map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-black/10 px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/45">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="animate-fade-in-up">
            <p className="section-kicker">Why teams switch</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl">
              Information architecture designed for operators, not just screenshots.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              The interface is built to answer the next operational question quickly: who is delayed, what needs approval, which plan is failing, and where margin is being lost.
            </p>

            <div className="mt-10 space-y-4">
              {workflows.map((flow) => (
                <article key={flow.title} className="glass-card-dark rounded-[1.6rem] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/7 text-[#f3c887]">
                      <flow.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{flow.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{flow.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`glass-card-light animate-fade-in-up rounded-[1.8rem] p-6 stagger-${index + 2}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08111d] text-[#f3c887] shadow-[0_12px_30px_-18px_rgba(8,17,29,0.9)]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#d9d2c5] bg-[#f3efe6] p-6 shadow-[0_30px_80px_-52px_rgba(0,0,0,0.35)] sm:p-8">
            <p className="section-kicker text-[#7a5a2c]">Operational modules</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight tracking-tight text-slate-950">
              A complex platform still needs a legible front door.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
              The public site now presents the product as a professional system: dense enough to build trust, structured enough to scan quickly, and clear about the depth of the platform.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {controlGrid.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-[#ddd4c6] bg-white/65 px-4 py-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#08111d] text-[#f3efe6]">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0a1524] p-6 text-white shadow-[0_30px_90px_-54px_rgba(0,0,0,0.8)] sm:p-8">
            <p className="section-kicker">Pricing clarity</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Monthly</p>
                <p className="mt-3 font-display text-5xl tracking-tight text-[#f3efe6]">$100</p>
                <p className="mt-2 text-sm text-slate-300">For teams that want low-friction rollout and immediate access.</p>
              </article>
              <article className="rounded-[1.5rem] border border-[#f3c887]/35 bg-[linear-gradient(180deg,rgba(243,200,135,0.14),rgba(255,255,255,0.04))] p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-[#f3c887]">Quarterly</p>
                <p className="mt-3 font-display text-5xl tracking-tight text-white">$200</p>
                <p className="mt-2 text-sm text-slate-300">Best value for operators standardizing dispatch, finance, and warehouse routines.</p>
                <p className="mt-4 inline-flex rounded-full border border-[#f3c887]/25 bg-[#f3c887]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#f7d7a7]">
                  Save 33%
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="flex-1">
                <Button className="w-full rounded-full bg-[#f3efe6] text-[#08111d] hover:bg-white">Open platform</Button>
              </Link>
              <Link href="tel:+998977087373" className="flex-1">
                <Button variant="outline" className="w-full rounded-full border-white/15 bg-transparent text-white hover:bg-white/8 hover:text-white">
                  Call sales
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-24 animate-fade-in-up overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,#f3efe6_0%,#f5c98e_38%,#102036_100%)] p-[1px]">
          <div className="rounded-[2.35rem] bg-[linear-gradient(135deg,rgba(7,17,29,0.96),rgba(11,23,40,0.94))] px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="section-kicker">Ready to upgrade the front door</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <h2 className="max-w-3xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                  Present the product like the serious operating platform it already is.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                  This redesign shifts the site from a simple landing page to an executive overview: stronger trust signals, more product depth, and a clearer path into the dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/login">
                  <Button size="lg" className="rounded-full bg-[#f3efe6] px-8 text-[#08111d] hover:bg-white">
                    Enter platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="tel:+998977087373">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8 hover:text-white"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Speak with team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/8 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 text-xs uppercase tracking-[0.22em] text-white/40 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} AutoFood</p>
          <p>Built for delivery teams operating at scale</p>
        </div>
      </footer>
    </div>
  )
}
