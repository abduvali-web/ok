'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'

type AuthHighlight = {
  icon: LucideIcon
  label: string
  detail: string
}

interface AuthShellProps {
  badge: string
  headline: string
  description: string
  highlights: AuthHighlight[]
  cardTitle: string
  cardSubtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({
  badge,
  headline,
  description,
  highlights,
  cardTitle,
  cardSubtitle,
  children,
  footer,
}: AuthShellProps) {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background text-foreground selection:bg-primary/30 relative flex flex-col items-center justify-center overflow-hidden">
      {/* Multi-layer Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-neutral-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-neutral-900 dark:via-background dark:to-background pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/[0.08] dark:from-blue-500/[0.04] via-violet-500/[0.04] dark:via-violet-500/[0.02] to-transparent pointer-events-none" />
      
      {/* Animated glow orbs */}
      <div className="absolute top-[-150px] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.1] dark:bg-blue-500/[0.04] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-100px] left-[5%] w-[350px] h-[350px] rounded-full bg-violet-500/[0.1] dark:bg-violet-500/[0.04] blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] right-[-5%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.08] dark:bg-emerald-500/[0.03] blur-[80px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }} />

      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl grid gap-8 px-4 py-12 lg:grid-cols-[1fr_420px]"
      >
        {/* Left side - branding & info */}
        <motion.aside variants={fadeUp} className="flex flex-col justify-center space-y-8 lg:pr-12">
          <Link href="/" className="inline-flex items-center gap-3 group w-max">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-white dark:to-white/80 text-white dark:text-black text-sm font-bold transition-all duration-300 group-hover:scale-110 shadow-md dark:shadow-[0_0_25px_rgba(255,255,255,0.12)]">
              AF
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white/90 group-hover:text-black dark:group-hover:text-white transition-colors">AutoFood</span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] text-xs font-bold tracking-wide text-zinc-600 dark:text-white/60 mb-5 backdrop-blur-md">
              {badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white dark:to-white/50 drop-shadow-sm dark:drop-shadow-none mb-5 leading-[1.1]">
              {headline}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-white/40 font-medium dark:font-light leading-relaxed max-w-md">
              {description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.label} className="group rounded-2xl border border-black/5 dark:border-white/[0.05] bg-white/60 dark:bg-white/[0.015] p-4 hover:bg-white dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/[0.1] transition-all duration-400 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.06] text-zinc-900 dark:text-white backdrop-blur-md group-hover:scale-110 group-hover:bg-black/10 dark:group-hover:bg-white/[0.1] transition-all duration-400">
                    <item.icon className="h-5 w-5 text-zinc-600 dark:text-white/70" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white/85 mb-1">{item.label}</p>
                    <p className="text-xs font-medium dark:font-light text-zinc-500 dark:text-white/40 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        {/* Right side - form card */}
        <motion.section 
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/[0.08] bg-white/80 dark:bg-[#080808]/80 backdrop-blur-2xl shadow-xl dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] p-8"
        >
          {/* Animated gradient glow */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-[250px] w-[250px] rounded-full bg-blue-500/[0.1] dark:bg-blue-500/[0.06] blur-[80px] opacity-60 pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-[200px] w-[200px] rounded-full bg-violet-500/[0.08] dark:bg-violet-500/[0.05] blur-[60px] opacity-40 pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          
          <div className="relative z-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white/95">{cardTitle}</h2>
              <p className="mt-2 text-sm font-medium dark:font-light text-zinc-500 dark:text-white/40">{cardSubtitle}</p>
            </div>

            <div>{children}</div>

            {footer ? <div className="mt-8 border-t border-black/5 dark:border-white/[0.06] pt-6">{footer}</div> : null}
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
