'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Globe2, Layers3, Phone, Route, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const controlPoints = [
  {
    title: 'Dispatch without blind spots',
    detail: 'Track order stages, courier workload, and delivery bottlenecks from one operational surface.',
    icon: Route,
  },
  {
    title: 'Client lifecycle in one flow',
    detail: 'Profiles, balances, plans, menus, and delivery history stay connected instead of scattered.',
    icon: Layers3,
  },
  {
    title: 'Financial clarity every day',
    detail: 'Unpaid orders, balances, and operational totals stay visible before they turn into support issues.',
    icon: WalletCards,
  },
]

const platformStats = [
  { label: 'Admin roles', value: '4' },
  { label: 'Core workspaces', value: 'Orders, clients, couriers' },
  { label: 'Client access', value: 'Portal + subdomain' },
  { label: 'Operational rhythm', value: 'Daily' },
]

const roleCards = [
  {
    title: 'Super Admin',
    detail: 'Controls platform permissions, admin structure, interface governance, and system oversight.',
  },
  {
    title: 'Middle Admin',
    detail: 'Runs the daily business: orders, clients, dispatch, history, finance, and subdomain operations.',
  },
  {
    title: 'Low Admin',
    detail: 'Works inside assigned limits with focused tools for execution, not unnecessary complexity.',
  },
  {
    title: 'Courier',
    detail: 'Gets route-ready delivery actions with status updates, address context, and fast completion flow.',
  },
]

const promiseList = [
  'Operational dashboards built for real daily use',
  'Client subdomain websites connected to actual admin data',
  'Tambo AI workflow for files, exports, and website edits',
  'Role-based routing with clearer navigation and fewer dead ends',
  'PWA-ready usage on mobile for admin and courier scenarios',
  'Unified database workspace for summed sheet visibility',
]

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen text-foreground">
      <header className="px-3 pt-3 sm:px-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-border/80 bg-card/80 px-4 py-3 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
              AF
            </span>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">AutoFood</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">operations platform</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="outline" size="sm">Admin login</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_390px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/75 px-6 py-8 shadow-[0_35px_100px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-primary/8 blur-3xl" aria-hidden />
            <div className="absolute bottom-0 left-12 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Delivery system for real operations
              </div>

              <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                One system for orders, clients, couriers, finance, and client-facing subdomain sites.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                AutoFood is built for operators who need cleaner execution, clearer accountability, and a better customer portal without juggling disconnected tools.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg" className="px-6">
                    {t.common.login}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="tel:+998977087373">
                  <Button size="lg" variant="outline" className="px-6">
                    <Phone className="h-4 w-4" />
                    +998 97 708 73 73
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {platformStats.map((item) => (
                  <div key={item.label} className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold tracking-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-border/80 bg-card/80 p-5 shadow-[0_32px_96px_-56px_rgba(15,23,42,0.34)] backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Globe2 className="h-3.5 w-3.5" />
              Client-facing experience
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Portal and subdomain websites stay connected to the same operation.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Customers can log in, review balance, follow menus, and check order history while middle admin manages the underlying workflow from the main system.
            </p>

            <div className="mt-6 space-y-3">
              {promiseList.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/70 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {controlPoints.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-[1.8rem] border border-border/75 bg-card/80 p-6 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.34)] backdrop-blur-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.detail}</p>
              </div>
            )
          })}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[2rem] border border-border/80 bg-card/80 p-6 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.34)] backdrop-blur-xl">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Role-aware platform</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Each role sees the right complexity level.</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/75 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Role-based access
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {roleCards.map((role) => (
                <div key={role.title} className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
                  <p className="text-lg font-semibold tracking-tight">{role.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{role.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/80 bg-primary px-6 py-7 text-primary-foreground shadow-[0_32px_86px_-50px_rgba(15,23,42,0.55)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">Commercial fit</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">Simple pricing, richer operation.</h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/80">
              Start with a lightweight rollout, then expand into deeper dispatch, database, AI, and client-portal workflows as the team matures.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 p-4">
                <p className="text-sm font-medium text-primary-foreground/80">Monthly</p>
                <p className="mt-2 text-3xl font-semibold">$100</p>
                <p className="mt-2 text-sm text-primary-foreground/70">For teams validating the workflow.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/8 p-4">
                <p className="text-sm font-medium text-primary-foreground/80">Quarterly</p>
                <p className="mt-2 text-3xl font-semibold">$200</p>
                <p className="mt-2 text-sm text-primary-foreground/70">Better fit for stable operational cadence.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
