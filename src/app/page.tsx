'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Phone,
  Zap,
  Route,
  ChartColumnIncreasing,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const features = [
  {
    icon: Zap,
    title: 'Auto Orders',
    desc: 'Schedule by profile, zone, and plan.',
  },
  {
    icon: Route,
    title: 'Live Dispatch',
    desc: 'Track couriers. Rebalance in real time.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Profit Board',
    desc: 'Margin, debt, speed — one view.',
  },
  {
    icon: ShieldCheck,
    title: 'Role Access',
    desc: 'Strict permissions per role.',
  },
]

const included = [
  'Unlimited orders & clients',
  'Courier mobile workflow',
  'Warehouse & finance',
  'Role-based permissions',
]

export default function LandingPage() {
  const { t } = useLanguage()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AutoFood',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: { '@type': 'Offer', price: '100', priceCurrency: 'USD' },
    description:
      "O'zbekistonda restoran va kafelar uchun zamonaviy yetkazib berishni avtomatlashtirish tizimi.",
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="font-display text-base font-semibold tracking-tight">
            AutoFood
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{t.common.login}</Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button size="sm" className="gap-1.5 rounded-full px-4">
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Contact</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        {/* ── Hero ── */}
        <section className="pb-20 pt-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Delivery operations platform
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Dispatch faster.
            <br />
            Operate smarter.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Unify orders, couriers, warehouse, and finance in one workflow. Built for restaurant delivery teams in Uzbekistan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2 rounded-full px-7">
                Enter Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" size="lg" className="gap-2 rounded-full px-7">
                <Phone className="h-4 w-4" />
                +998 97 708 73 73
              </Button>
            </Link>
          </div>

          {/* Metrics strip */}
          <div className="mt-14 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border">
            {[
              { v: '1,200+', l: 'Restaurants' },
              { v: '46%', l: 'Delivery gain' },
              { v: '58k', l: 'Daily orders' },
            ].map((s) => (
              <div key={s.l} className="bg-card px-5 py-4 text-center">
                <p className="font-display text-2xl font-bold">{s.v}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-border pt-16">
          <div className="grid gap-8 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border">
                  <f.icon className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="mt-20 border-t border-border pt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Full product access. No hidden fees.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-lg border border-border p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Monthly</p>
              <p className="mt-3 font-display text-4xl font-bold">$100</p>
              <p className="mt-1 text-sm text-muted-foreground">per month</p>
              <Link href="tel:+998977087373" className="mt-5 block">
                <Button variant="outline" className="w-full">Choose plan</Button>
              </Link>
            </div>
            {/* Quarterly */}
            <div className="rounded-lg border-2 border-foreground p-6">
              <div className="mb-2 inline-block rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                Best value
              </div>
              <p className="font-display text-4xl font-bold">$200</p>
              <p className="mt-1 text-sm text-muted-foreground">3 months — save 33%</p>
              <Link href="tel:+998977087373" className="mt-5 block">
                <Button className="w-full">Start now</Button>
              </Link>
            </div>
          </div>

          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ── */}
        <section className="mt-20 rounded-lg bg-foreground p-8 text-background sm:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-60">Launch faster</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            One command center for delivery ops
          </h2>
          <p className="mt-3 text-sm opacity-70">
            Book a walkthrough. 30-day trial included.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button variant="secondary" size="lg" className="rounded-full px-7">
                Open platform
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" size="lg" className="rounded-full border-background/30 bg-transparent px-7 text-background hover:bg-background/10">
                <Phone className="h-4 w-4" />
                Call now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AutoFood</p>
          <p>Built for high-volume delivery</p>
        </div>
      </footer>
    </div>
  )
}
