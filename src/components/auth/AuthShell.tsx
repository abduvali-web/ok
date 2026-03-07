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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-primary/30 relative flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 to-transparent blur-[80px] pointer-events-none" />

      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl grid gap-8 px-4 py-12 lg:grid-cols-[1fr_420px]"
      >
        <motion.aside variants={fadeUp} className="flex flex-col justify-center space-y-8 lg:pr-12">
          <Link href="/" className="inline-flex items-center gap-3 group w-max">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black text-sm font-bold transition-transform group-hover:scale-110 shadow-lg shadow-white/10">
              AF
            </div>
            <span className="text-xl font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">AutoFood</span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/70 mb-4">
              {badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm mb-4 leading-tight">
              {headline}
            </h1>
            <p className="text-lg text-white/50 font-light leading-relaxed max-w-md">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.label} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90 mb-1">{item.label}</p>
                    <p className="text-xs font-light text-white/50 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        <motion.section 
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-8"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[200px] w-[200px] rounded-full bg-primary/20 blur-[60px] opacity-40 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">{cardTitle}</h2>
              <p className="mt-2 text-sm font-light text-white/50">{cardSubtitle}</p>
            </div>

            <div>{children}</div>

            {footer ? <div className="mt-8 border-t border-white/10 pt-6">{footer}</div> : null}
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
