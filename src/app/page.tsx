'use client'

import Link from 'next/link'
import { ArrowRight, Phone, Zap, Route, ChartColumnIncreasing, ShieldCheck, Check, ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const features = [
  {
    icon: Zap,
    title: 'Auto Orders',
    desc: 'Smart scheduling by zone and delivery plan. Set it once, run forever.',
    accent: 'from-amber-400 to-orange-500',
  },
  {
    icon: Route,
    title: 'Live Dispatch',
    desc: 'Real-time courier tracking with dynamic route rebalancing.',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Finance',
    desc: 'Revenue, debts, margins — all in one clear view.',
    accent: 'from-emerald-400 to-green-500',
  },
  {
    icon: ShieldCheck,
    title: 'Access Control',
    desc: 'Role-based permissions for every team member.',
    accent: 'from-violet-400 to-purple-500',
  },
]

const included = [
  'Unlimited orders & clients',
  'Courier mobile app',
  'Warehouse & finance',
  'Role-based access',
  'Auto order scheduling',
  'Route optimization',
]

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ─── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            AutoFood
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button size="sm" className="gap-1.5 rounded-full px-5">
                {t.common.login}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        {/* ─── Hero ─── */}
        <section className="animate-fade-in-up pb-20 pt-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Delivery Operations Platform
          </div>

          <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Run delivery.
            <br />
            <span className="text-muted-foreground">Without the chaos.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Orders, couriers, warehouse, and finance — unified in one command center. Built for food delivery teams.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2 rounded-full px-8 text-base shadow-elevated">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" size="lg" className="gap-2 rounded-full px-6 text-base">
                <Phone className="h-4 w-4" />
                +998 97 708 73 73
              </Button>
            </Link>
          </div>
        </section>

        {/* ─── Social Proof ─── */}
        <div className="animate-fade-in-up stagger-2 mb-20 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card shadow-smooth">
          {[
            { v: '1,200+', l: 'Teams' },
            { v: '46%', l: 'Faster dispatch' },
            { v: '58k', l: 'Orders/day' },
          ].map((s) => (
            <div key={s.l} className="px-4 py-6 text-center sm:px-8">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ─── Features ─── */}
        <section className="animate-fade-in-up stagger-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Capabilities
          </p>
          <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need to manage delivery
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group animate-fade-in-up stagger-${i + 2} flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-elegant`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} shadow-smooth`}
                >
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="mt-24">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Simple Pricing
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Full access. No hidden fees.
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-elegant">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly</p>
              <p className="mt-3 text-4xl font-bold tracking-tight">$100</p>
              <p className="mt-0.5 text-sm text-muted-foreground">per month</p>
              <Link href="tel:+998977087373" className="mt-6 block">
                <Button variant="outline" className="w-full rounded-xl">Get started</Button>
              </Link>
            </div>

            {/* Quarterly — highlighted */}
            <div className="relative rounded-2xl border-2 border-foreground bg-card p-6 shadow-elevated transition-all duration-300">
              <span className="absolute -top-3 left-5 inline-block rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                Save 33%
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quarterly</p>
              <p className="mt-3 text-4xl font-bold tracking-tight">$200</p>
              <p className="mt-0.5 text-sm text-muted-foreground">for 3 months</p>
              <Link href="tel:+998977087373" className="mt-6 block">
                <Button className="w-full rounded-xl">Start now</Button>
              </Link>
            </div>
          </div>

          {/* All included */}
          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="mt-24 overflow-hidden rounded-3xl bg-foreground p-8 text-background sm:p-12">
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-widest opacity-50">
              Ready to start?
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              One command center for
              <br className="hidden sm:block" />
              {' '}your entire operation
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-60">
              Book a demo and try it free for 30 days. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="secondary" size="lg" className="gap-2 rounded-full px-8">
                  Open platform
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="tel:+998977087373">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-background/20 bg-transparent text-background hover:bg-background/10"
                >
                  <Phone className="h-4 w-4" />
                  Call us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AutoFood</p>
          <p>Built for delivery teams</p>
        </div>
      </footer>
    </div>
  )
}
