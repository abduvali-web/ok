'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Boxes,
  ChartColumnIncreasing,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  Phone,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Users,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserGuide } from '@/components/UserGuide'
import { useLanguage } from '@/contexts/LanguageContext'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
    },
  },
}

const highlights = [
  { label: 'Active Restaurants', value: '1,200+' },
  { label: 'Average Delivery Gain', value: '46%' },
  { label: 'Daily Auto Orders', value: '58k' },
]

const features = [
  {
    icon: Zap,
    title: 'Auto Order Engine',
    description:
      'Create scheduled orders by customer profile, route zone, and meal plan in a few clicks.',
  },
  {
    icon: Route,
    title: 'Live Dispatch Control',
    description:
      'Track couriers in real time, rebalance routes, and resolve delays before customers call.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Profit Visibility',
    description:
      'Monitor margin, debt, delivery speed, and team performance from one control board.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Security',
    description:
      'Separate access for super admin, middle admin, low admin, and courier with strict permissions.',
  },
]

const workflow = [
  {
    title: 'Capture',
    text: 'Collect customer preferences, delivery windows, and calorie targets in one profile.',
  },
  {
    title: 'Plan',
    text: 'Generate auto orders and assign couriers using delivery-day templates and map-based routing.',
  },
  {
    title: 'Deliver',
    text: 'Handle status changes, payments, and proof of completion from mobile courier screens.',
  },
  {
    title: 'Optimize',
    text: 'Use daily statistics to improve kitchen output, dispatch timing, and operating cost.',
  },
]

const testimonials = [
  {
    author: 'Sardor U.',
    role: 'Restaurant Owner',
    quote:
      'After switching to AutoFood, dispatch time dropped in week one and customer complaints fell sharply.',
  },
  {
    author: 'Dilnoza K.',
    role: 'Operations Manager',
    quote:
      'The courier map and auto orders gave us real operational control. We now run with fewer manual calls.',
  },
  {
    author: 'Jamshid A.',
    role: 'Founder',
    quote:
      'What used to be messy spreadsheets is now a clean process. The team finally works from one source of truth.',
  },
]

export default function LandingPage() {
  const { t } = useLanguage()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AutoFood',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '100',
      priceCurrency: 'USD',
    },
    description:
      "O'zbekistonda restoran va kafelar uchun zamonaviy yetkazib berishni avtomatlashtirish tizimi.",
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" />
      </div>

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-elegant">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold tracking-tight">AutoFood</p>
              <p className="text-xs text-muted-foreground">Delivery OS</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <UserGuide
              title="AutoFood Guide"
              guides={[
                {
                  title: 'Auto Orders',
                  description:
                    'Schedule recurring orders by day, week, or month and reduce repetitive admin work.',
                  buttonName: 'Automation',
                  icon: <TimerReset className="h-5 w-5 text-primary" />,
                },
                {
                  title: 'Courier Management',
                  description:
                    'Track all couriers in real time and distribute orders without spreadsheet coordination.',
                  buttonName: 'Courier panel',
                  icon: <Globe className="h-5 w-5 text-primary" />,
                },
                {
                  title: 'Customer CRM',
                  description:
                    'Store history, payment, and delivery preferences in one customer record.',
                  buttonName: 'CRM',
                  icon: <Users className="h-5 w-5 text-primary" />,
                },
              ]}
            />
            <Link href="/login" aria-label="Navigate to login page" className="hidden sm:block">
              <Button variant="ghost">{t.common.login}</Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button className="btn-3d h-10 gap-2 rounded-full px-5">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
                <span className="sm:hidden">Call</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        <section className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-7">
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="bg-amber-100/70 text-emerald-900 dark:bg-amber-500/20 dark:text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Built for restaurant delivery teams
              </Badge>
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display text-4xl font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Dispatch faster.
              <br />
              <span className="text-gradient">Operate smarter.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              AutoFood unifies order creation, courier assignment, warehouse planning, and finance tracking in one
              production-grade workflow.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="btn-3d ripple h-13 w-full rounded-full px-8 text-base sm:w-auto">
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="tel:+998977087373" className="w-full sm:w-auto">
                <Button variant="outline" className="h-13 w-full rounded-full px-8 text-base sm:w-auto">
                  <Phone className="h-4 w-4" />
                  +998 97 708 73 73
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 pt-2 sm:grid-cols-3">
              {highlights.map((item) => (
                <Card key={item.label} className="surface-panel rounded-2xl px-5 py-4">
                  <p className="font-display text-2xl font-bold text-gradient-blue">{item.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <Card className="surface-panel-strong relative overflow-hidden rounded-[1.8rem] border-border/60 p-7 sm:p-9">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-amber-400/25 blur-3xl" />

              <div className="relative space-y-6">
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Today status</p>
                    <p className="font-display text-xl font-semibold">Dispatch running</p>
                  </div>
                  <Badge>Live</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Orders', value: '247', trend: '+12%' },
                    { label: 'Couriers', value: '45', trend: 'all active' },
                    { label: 'On-time', value: '97%', trend: 'weekly avg' },
                    { label: 'Revenue', value: '$21k', trend: 'this week' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/70 bg-background/72 p-4">
                      <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 font-display text-2xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{stat.trend}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/65 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Route plan</p>
                    <p className="text-xs text-muted-foreground">Auto optimized</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Segment couriers by zone and traffic profile
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Prioritize prepaid and high-SLA customers
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="mt-20 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
            >
              <Card className="glass-card h-full rounded-2xl border-border/70 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-amber-500/15 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-24 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4"
          >
            <Badge variant="outline">Workflow</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">One operating rhythm from order to profit</h2>
            <p className="max-w-xl text-muted-foreground">
              Replace fragmented chats and sheets with a single flow that coordinates sales, kitchen, dispatch, and
              finance.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Open control panel
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="space-y-4">
            {workflow.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
                className="glass-intense relative rounded-2xl border-border/70 p-5 sm:p-6"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="glass-card h-full rounded-2xl p-6">
                <div className="mb-4 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">"{item.quote}"</p>
                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="font-semibold">{item.author}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{item.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-24">
          <Card className="surface-panel-strong overflow-hidden rounded-[1.8rem] border-border/70 p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <Badge variant="outline" className="mb-4 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                  Pricing
                </Badge>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Simple plans with full product access</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Start with monthly billing or lock in a lower quarterly price. Both include all core modules.
                </p>
                <ul className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  {[
                    'Unlimited orders and clients',
                    'Courier mobile workflow',
                    'Warehouse and finance modules',
                    'Role-based admin permissions',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Card className="glass-card rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Monthly</p>
                  <p className="mt-2 font-display text-4xl font-bold">$100</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  <Link href="tel:+998977087373" className="mt-4 block">
                    <Button variant="outline" className="w-full">Choose plan</Button>
                  </Link>
                </Card>
                <Card className="glass-intense rounded-2xl border-primary/30 p-5">
                  <Badge className="mb-3">Best value</Badge>
                  <p className="font-display text-4xl font-bold">$200</p>
                  <p className="text-sm text-muted-foreground">3 months total</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-300">
                    Save 33%
                  </p>
                  <Link href="tel:+998977087373" className="mt-4 block">
                    <Button className="w-full">Start now</Button>
                  </Link>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-24">
          <Card className="overflow-hidden rounded-[1.8rem] border-border/70 bg-slate-900 p-8 text-slate-100 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.2),transparent_42%)]" />
            <div className="relative z-10 flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Launch faster</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
                  Bring your delivery ops under one command center
                </h2>
                <p className="mt-3 text-slate-300">
                  Book a walkthrough and get your team live with a 30-day trial period.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/login">
                  <Button className="h-12 w-full rounded-full px-8">Open platform</Button>
                </Link>
                <Link href="tel:+998977087373">
                  <Button variant="outline" className="h-12 w-full rounded-full border-slate-500 bg-transparent text-slate-100 hover:bg-slate-800">
                    <Phone className="h-4 w-4" />
                    Call now
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/70 py-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AutoFood. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            Built for high-volume delivery teams
          </p>
        </div>
      </footer>
    </div>
  )
}
