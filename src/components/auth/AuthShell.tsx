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
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#06060a] text-foreground selection:bg-indigo-500/20 relative flex flex-col items-center justify-center overflow-hidden">
      {/* Multi-layer Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-dot-grid pointer-events-none opacity-40" />
      <div className="absolute inset-0 z-0 bg-aurora pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-indigo-500/[0.08] dark:from-indigo-500/[0.04] via-violet-500/[0.04] dark:via-violet-500/[0.02] to-transparent pointer-events-none" />
      
      {/* Animated glow orbs */}
      <div className="absolute top-[-120px] right-[8%] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.08] dark:bg-indigo-500/[0.04] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-80px] left-[3%] w-[350px] h-[350px] rounded-full bg-violet-500/[0.08] dark:bg-violet-500/[0.04] blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[35%] right-[-3%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.06] dark:bg-emerald-500/[0.03] blur-[80px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }} />

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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all duration-300 group-hover:scale-110 shadow-lg shadow-indigo-500/25">
              AF
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white/90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">AutoFood</span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/15 bg-indigo-50 dark:bg-indigo-500/[0.06] text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400 mb-5 backdrop-blur-md">
              {badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-hero drop-shadow-sm dark:drop-shadow-none mb-5 leading-[1.12]">
              {headline}
            </h1>
            <p className="text-base text-zinc-500 dark:text-white/40 font-medium leading-relaxed max-w-md">
              {description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item, i) => {
              const iconColors = ['text-blue-500', 'text-violet-500', 'text-emerald-500']
              const iconBgs = ['bg-blue-500/10 dark:bg-blue-500/15', 'bg-violet-500/10 dark:bg-violet-500/15', 'bg-emerald-500/10 dark:bg-emerald-500/15']
              
              return (
                <div key={item.label} className="group rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02] p-4 hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all duration-400 shadow-sm backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBgs[i % 3]} backdrop-blur-md group-hover:scale-110 transition-all duration-400`}>
                      <item.icon className={`h-5 w-5 ${iconColors[i % 3]}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-white/85 mb-1">{item.label}</p>
                      <p className="text-xs font-medium text-zinc-400 dark:text-white/35 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.aside>

        {/* Right side - form card */}
        <motion.section 
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c0c12]/80 backdrop-blur-2xl shadow-2xl dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] p-8"
        >
          {/* Top shine line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none" />
          
          {/* Animated gradient glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[220px] w-[220px] rounded-full bg-indigo-500/[0.08] dark:bg-indigo-500/[0.05] blur-[80px] opacity-60 pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 -ml-14 -mb-14 h-[180px] w-[180px] rounded-full bg-violet-500/[0.06] dark:bg-violet-500/[0.04] blur-[60px] opacity-40 pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          
          <div className="relative z-10">
            <div className="mb-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 mb-4">
                AF
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white/95">{cardTitle}</h2>
              <p className="mt-2 text-sm font-medium text-zinc-400 dark:text-white/40">{cardSubtitle}</p>
            </div>

            <div>{children}</div>

            {footer ? <div className="mt-8 border-t border-zinc-100 dark:border-white/[0.06] pt-6">{footer}</div> : null}
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
