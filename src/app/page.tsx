'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, CheckCircle2, Globe2, Layers3, Phone, Route, ShieldCheck, WalletCards, ChevronRight, Sparkles, Star, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const localized = {
  en: {
    platform: 'Operations platform',
    adminLogin: 'Admin login',
    openDashboard: 'Open dashboard',
    heroTag: 'Delivery operations system',
    heroTitle: 'One system for orders, clients, couriers, finance, and client-facing subdomain sites.',
    heroDescription:
      'AutoFood is built for teams that need stable daily execution without switching between disconnected tools.',
    portalTitle: 'Client portal and subdomain sites are connected to the same data.',
    portalLabel: 'Client portal',
    portalDescription:
      'Customers can check plans, balances, menus, and order history while admins manage the same records in one workspace.',
    roleTitle: 'Each role sees the right level of complexity.',
    roleBadge: 'Role-based access',
    pricingTitle: 'Simple pricing, practical rollout.',
    pricingDescription:
      'Start with core operations, then expand into route optimization, AI workflows, and customer web access.',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    monthlyNote: 'For teams validating workflow.',
    quarterlyNote: 'For teams with stable operating cadence.',
    footerCta: 'Ready to streamline your delivery operations?',
    footerCtaButton: 'Get started today',
    stats: [
      { label: 'Admin roles', value: '4' },
      { label: 'Core workspaces', value: 'Orders, clients, couriers' },
      { label: 'Client access', value: 'Portal + subdomain' },
      { label: 'Operational rhythm', value: 'Daily' },
    ],
    points: [
      {
        title: 'Dispatch visibility',
        detail: 'Track stages, courier workload, and bottlenecks in one place.',
        icon: Route,
      },
      {
        title: 'Connected client lifecycle',
        detail: 'Profiles, balances, plans, and history stay in one workflow.',
        icon: Layers3,
      },
      {
        title: 'Daily finance clarity',
        detail: 'Debt, balance, and totals stay visible before issues grow.',
        icon: WalletCards,
      },
    ],
    promises: [
      'Operational dashboards designed for daily use',
      'Client subdomain websites connected to admin data',
      'AI workflow for files, exports, and website edits',
      'Role-based routing with clearer navigation',
      'PWA-ready mobile usage for admin and courier',
      'Unified data workspace for daily operations',
    ],
    roles: [
      {
        title: 'Super Admin',
        detail: 'Controls permissions, admin structure, and system governance.',
      },
      {
        title: 'Middle Admin',
        detail: 'Runs orders, clients, dispatch, history, and finance.',
      },
      {
        title: 'Low Admin',
        detail: 'Works with a focused toolset under scoped access.',
      },
      {
        title: 'Courier',
        detail: 'Receives route-ready delivery actions with fast status updates.',
      },
    ],
  },
  uz: {
    platform: 'Operatsion platforma',
    adminLogin: 'Admin kirish',
    openDashboard: 'Panelni ochish',
    heroTag: 'Yetkazib berish boshqaruvi tizimi',
    heroTitle: 'Buyurtma, mijoz, kuryer, moliya va mijoz subdomain saytlari uchun yagona tizim.',
    heroDescription:
      'AutoFood kundalik ishni barqaror yuritish uchun yaratilgan, ortiqcha tizimlar orasida almashishga hojat yoq.',
    portalTitle: 'Mijoz portali va subdomain saytlar bir xil malumotlar bilan ishlaydi.',
    portalLabel: 'Mijoz portali',
    portalDescription:
      'Mijozlar reja, balans, menyu va tarixni koradi, admin esa shu malumotlarni bitta joydan boshqaradi.',
    roleTitle: 'Har bir rol oziga kerakli darajadagi interfeysni koradi.',
    roleBadge: 'Rol asosidagi kirish',
    pricingTitle: 'Oddiy narx, amaliy joriy qilish.',
    pricingDescription:
      'Asosiy jarayondan boshlang, keyin marshrut optimizatsiyasi, AI va mijoz web kirishini yoqing.',
    monthly: 'Oylik',
    quarterly: 'Choraklik',
    monthlyNote: 'Jarayonni tekshirayotgan jamoalar uchun.',
    quarterlyNote: 'Barqaror ishlayotgan jamoalar uchun.',
    footerCta: 'Yetkazib berish jarayonini soddalashtirmoqchimisiz?',
    footerCtaButton: 'Bugun boshlang',
    stats: [
      { label: 'Admin rollari', value: '4' },
      { label: 'Asosiy bolimlar', value: 'Buyurtma, mijoz, kuryer' },
      { label: 'Mijoz kirishi', value: 'Portal + subdomain' },
      { label: 'Ish ritmi', value: 'Har kun' },
    ],
    points: [
      {
        title: 'Dispecher nazorati',
        detail: 'Bosqichlar, kuryer yuklamasi va kechikishlar bitta oynada.',
        icon: Route,
      },
      {
        title: 'Mijoz jarayoni bir joyda',
        detail: 'Profil, balans, reja va tarix uzilmasdan yuritiladi.',
        icon: Layers3,
      },
      {
        title: 'Kundalik moliya aniqligi',
        detail: 'Qarzdorlik va balanslar vaqtida korinib turadi.',
        icon: WalletCards,
      },
    ],
    promises: [
      'Kundalik ish uchun qulay boshqaruv oynalari',
      'Admin malumotlari bilan boglangan mijoz saytlari',
      'Fayl va sayt ishlari uchun AI ish jarayoni',
      'Tushunarli rol asosidagi navigatsiya',
      'Admin va kuryer uchun PWA mobil tayyorlik',
      'Kundalik boshqaruv uchun yagona malumot maydoni',
    ],
    roles: [
      {
        title: 'Super Admin',
        detail: 'Ruxsatlar, admin tuzilmasi va tizim nazoratini boshqaradi.',
      },
      {
        title: 'Middle Admin',
        detail: 'Buyurtma, mijoz, dispecher, tarix va moliyani yuritadi.',
      },
      {
        title: 'Low Admin',
        detail: 'Cheklangan kirish bilan kerakli vositalarda ishlaydi.',
      },
      {
        title: 'Kuryer',
        detail: 'Yetkazish uchun tayyor topshiriqlar va tez holat yangilashni oladi.',
      },
    ],
  },
  ru: {
    platform: 'Операционная платформа',
    adminLogin: 'Вход для админа',
    openDashboard: 'Открыть панель',
    heroTag: 'Система управления доставкой',
    heroTitle: 'Единая система для заказов, клиентов, курьеров, финансов и клиентских subdomain-сайтов.',
    heroDescription:
      'AutoFood помогает команде стабильно работать каждый день без переключения между разными инструментами.',
    portalTitle: 'Клиентский портал и subdomain-сайты работают на тех же данных.',
    portalLabel: 'Клиентский портал',
    portalDescription:
      'Клиенты видят планы, баланс, меню и историю, а админ управляет теми же записями в одном месте.',
    roleTitle: 'Каждая роль получает нужный уровень сложности интерфейса.',
    roleBadge: 'Ролевой доступ',
    pricingTitle: 'Простая цена и поэтапный запуск.',
    pricingDescription:
      'Начните с базовых процессов, затем подключайте оптимизацию маршрутов, AI и веб-доступ для клиентов.',
    monthly: 'Ежемесячно',
    quarterly: 'Поквартально',
    monthlyNote: 'Для команд, которые проверяют процесс.',
    quarterlyNote: 'Для команд со стабильным рабочим циклом.',
    footerCta: 'Готовы оптимизировать доставку?',
    footerCtaButton: 'Начать сегодня',
    stats: [
      { label: 'Ролей админа', value: '4' },
      { label: 'Основные разделы', value: 'Заказы, клиенты, курьеры' },
      { label: 'Доступ клиента', value: 'Портал + subdomain' },
      { label: 'Ритм работы', value: 'Ежедневно' },
    ],
    points: [
      {
        title: 'Прозрачная диспетчеризация',
        detail: 'Статусы, загрузка курьеров и узкие места видны в одном месте.',
        icon: Route,
      },
      {
        title: 'Цикл клиента без разрывов',
        detail: 'Профили, баланс, планы и история связаны в одном процессе.',
        icon: Layers3,
      },
      {
        title: 'Финансы под контролем',
        detail: 'Долги, баланс и суммы видны до появления проблем.',
        icon: WalletCards,
      },
    ],
    promises: [
      'Операционные панели для реальной ежедневной работы',
      'Клиентские сайты с данными из админ-системы',
      'AI-поток для файлов, экспортов и правок сайта',
      'Ролевая навигация без лишних экранов',
      'PWA-режим для админа и курьера на мобильных',
      'Единое пространство данных для ежедневной работы',
    ],
    roles: [
      {
        title: 'Супер-админ',
        detail: 'Управляет правами, структурой админов и общим контролем системы.',
      },
      {
        title: 'Средний админ',
        detail: 'Ведет заказы, клиентов, маршруты, историю и финансы.',
      },
      {
        title: 'Низкий админ',
        detail: 'Работает в пределах назначенных прав с нужным набором инструментов.',
      },
      {
        title: 'Курьер',
        detail: 'Получает готовые задачи по доставке и быстро обновляет статусы.',
      },
    ],
  },
} as const

function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  return (
    <span ref={ref} className={className}>
      {isInView ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      ) : value}
    </span>
  )
}

export default function LandingPage() {
  const { t, language } = useLanguage()
  const copy = localized[language]
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  }

  const iconColors = ['text-blue-500', 'text-violet-500', 'text-emerald-500']
  const iconBgColors = [
    'bg-blue-500/10 dark:bg-blue-500/15',
    'bg-violet-500/10 dark:bg-violet-500/15',
    'bg-emerald-500/10 dark:bg-emerald-500/15'
  ]
  const cardGlows = [
    'hover:shadow-glow-blue',
    'hover:shadow-glow-violet',
    'hover:shadow-glow-emerald'
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#06060a] text-foreground selection:bg-indigo-500/20 relative overflow-hidden">
      {/* ═══ Background Layers ═══ */}
      <div className="fixed inset-0 z-0 bg-dot-grid pointer-events-none opacity-60" />
      <div className="fixed inset-0 z-0 bg-aurora pointer-events-none" />
      
      {/* Hero gradient wash */}
      <div className="fixed top-0 left-0 right-0 h-[900px] bg-gradient-to-b from-indigo-500/[0.07] via-violet-500/[0.04] to-transparent pointer-events-none" />
      
      {/* Animated mesh orbs */}
      <div className="fixed top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full bg-blue-500/[0.08] dark:bg-blue-500/[0.04] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="fixed top-[15%] right-[-8%] w-[35%] h-[50%] rounded-full bg-violet-500/[0.07] dark:bg-violet-500/[0.04] blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
      <div className="fixed bottom-[-5%] left-[25%] w-[50%] h-[35%] rounded-full bg-indigo-500/[0.06] dark:bg-indigo-500/[0.03] blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s', animationDuration: '10s' }} />

      {/* ═══ Floating Header ═══ */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-5 px-4 pointer-events-none"
      >
        <div className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-2xl px-5 py-2.5 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 dark:bg-black/60 border border-black/8 dark:border-white/[0.08] backdrop-blur-2xl shadow-lg dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border border-transparent'
        }`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold transition-all duration-300 group-hover:scale-110 shadow-lg shadow-indigo-500/25">
              <span className="relative z-10">AF</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white/90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">AutoFood</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <span className="text-[13px] font-semibold text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-300 hover:after:w-full">{copy.adminLogin}</span>
            </Link>
            <Link href="/login">
              <Button className="rounded-xl h-9 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 group border-none text-[13px] font-semibold">
                {copy.openDashboard} <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-40 pb-12 space-y-28">
        {/* ═══ HERO SECTION ═══ */}
        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 dark:border-indigo-500/15 bg-indigo-50 dark:bg-indigo-500/[0.06] backdrop-blur-md text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 mb-8 shadow-sm relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10 tracking-wide">{copy.heroTag}</span>
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-[2.75rem] sm:text-6xl md:text-[4.5rem] font-bold tracking-[-0.03em] text-gradient-hero mb-7 leading-[1.08]"
          >
            {copy.heroTitle}
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="text-lg md:text-xl text-zinc-500 dark:text-white/45 max-w-2xl font-medium leading-relaxed mb-10"
          >
            {copy.heroDescription}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button className="h-13 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[15px] font-bold hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.03] transition-all duration-300 active:scale-95 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 group border-none">
                {(t.common as any)?.login || copy.adminLogin} <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" className="h-13 px-8 rounded-2xl border-zinc-200 dark:border-white/[0.1] bg-white/70 dark:bg-white/[0.04] text-zinc-700 dark:text-white/80 hover:bg-white dark:hover:bg-white/[0.08] text-[15px] font-bold backdrop-blur-md transition-all duration-300 hover:border-zinc-300 dark:hover:border-white/[0.18]">
                <Phone className="mr-2.5 h-4 w-4 text-zinc-400 dark:text-white/40" />
                <span className="tracking-wide">+998 97 708 73 73</span>
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={fadeUp} className="mt-14 flex flex-wrap items-center justify-center gap-6 text-zinc-400 dark:text-white/30">
            {[
              { icon: ShieldCheck, text: 'Secure & encrypted' },
              { icon: Zap, text: 'Real-time sync' },
              { icon: Star, text: 'PWA ready' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs font-medium">
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ═══ FEATURE BENTO GRID ═══ */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid gap-5 md:grid-cols-3"
        >
          {copy.points.map((item, i) => {
            const Icon = item.icon
            
            return (
              <motion.div 
                key={item.title} 
                variants={fadeUp}
                className={`group relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-7 hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/[0.1] shadow-sm hover:shadow-xl dark:hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl ${cardGlows[i % 3]}`}
              >
                {/* Hover glow effect */}
                <div className={`absolute -top-20 -right-20 h-[200px] w-[200px] rounded-full ${iconBgColors[i % 3]} opacity-0 group-hover:opacity-60 transition-all duration-700 blur-[60px] pointer-events-none`} />
                
                <div className="relative z-10">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColors[i % 3]} border border-transparent mb-6 group-hover:scale-110 transition-all duration-500`}>
                    <Icon className={`h-5 w-5 ${iconColors[i % 3]}`} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white/95 mb-2.5 tracking-tight">{item.title}</h3>
                  <p className="text-zinc-500 dark:text-white/40 leading-relaxed text-[14.5px]">{item.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.section>

        {/* ═══ PORTAL & STATS GRID ═══ */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"
        >
          {/* Portal card */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-8 md:p-10 shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl group hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all duration-500">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-[300px] w-[300px] rounded-full bg-indigo-500/[0.06] dark:bg-indigo-500/[0.04] blur-[80px] opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/[0.06] font-semibold text-indigo-600 dark:text-indigo-400 mb-7 text-xs">
                <Globe2 className="h-3.5 w-3.5" />
                <span className="tracking-wide">{copy.portalLabel}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white/95 mb-4 tracking-tight leading-[1.15] max-w-[90%]">{copy.portalTitle}</h2>
              <p className="text-[15px] text-zinc-500 dark:text-white/40 leading-relaxed font-medium max-w-md mb-8">{copy.portalDescription}</p>
              
              <div className="space-y-3">
                {copy.promises.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-3.5 group/item">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/[0.1] border border-emerald-200 dark:border-emerald-500/20 group-hover/item:scale-110 transition-transform">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-zinc-600 dark:text-white/55 font-medium text-[14px] group-hover/item:text-zinc-900 dark:group-hover/item:text-white/80 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className="group flex flex-col justify-center rounded-[1.75rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-7 hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all duration-500 shadow-sm hover:shadow-lg dark:hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <AnimatedNumber value={stat.value} className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5 block" />
                  <p className="text-[12px] text-zinc-400 dark:text-white/35 font-semibold tracking-wider uppercase">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ═══ ROLES & PRICING GRID ═══ */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid gap-5 lg:grid-cols-[1fr_1fr]"
        >
          {/* Roles Card */}
          <motion.div variants={fadeUp} className="rounded-[1.75rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-8 md:p-10 flex flex-col shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-[-80px] left-[-80px] h-[250px] w-[250px] rounded-full bg-emerald-500/[0.06] blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold tracking-wider uppercase mb-3">
                    <ShieldCheck className="h-3 w-3" />
                    {copy.roleBadge}
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white/95 tracking-tight">{copy.roleTitle}</h2>
                </div>
              </div>
              <div className="grid gap-3 flex-1">
                {copy.roles.map((role, i) => (
                  <div key={role.title} className="rounded-2xl border border-zinc-100 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-white/[0.015] p-4 hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-200 dark:hover:border-white/[0.08] transition-all duration-400 group/role">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/15 dark:to-violet-500/15 text-indigo-500 dark:text-indigo-400 text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-white/90 tracking-tight">{role.title}</h4>
                        <p className="text-[13px] text-zinc-400 dark:text-white/35 font-medium leading-relaxed mt-0.5">{role.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Pricing Card */}
          <motion.div variants={fadeUp} className="rounded-[1.75rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-8 md:p-10 flex flex-col justify-between shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-500/[0.06] blur-[80px] opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white/95 mb-4 tracking-tight max-w-[80%] leading-[1.15]">{copy.pricingTitle}</h2>
              <p className="text-[15px] text-zinc-500 dark:text-white/40 font-medium leading-relaxed mb-8 max-w-sm">{copy.pricingDescription}</p>
            </div>
            
            <div className="space-y-3.5 relative z-10">
              {/* Monthly */}
              <div className="group rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] p-6 flex items-center justify-between hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all duration-400 hover:shadow-md">
                <div className="min-w-0 pr-4">
                  <h4 className="text-base font-bold text-zinc-800 dark:text-white/90 tracking-tight">{copy.monthly}</h4>
                  <p className="text-[13px] text-zinc-400 dark:text-white/35 font-medium mt-1">{copy.monthlyNote}</p>
                </div>
                <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white shrink-0">$100</div>
              </div>
              
              {/* Quarterly - Featured */}
              <div className="group rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/25 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/[0.06] dark:to-violet-500/[0.04] p-6 flex items-center justify-between transition-all duration-400 relative overflow-hidden shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 min-w-0 pr-4">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white/95 tracking-tight flex items-center gap-2.5">
                    {copy.quarterly}
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-[10px] text-white font-bold uppercase tracking-widest">Popular</span>
                  </h4>
                  <p className="text-[13px] text-zinc-500 dark:text-white/40 font-medium mt-1">{copy.quarterlyNote}</p>
                </div>
                <div className="text-2xl font-bold tracking-tight relative z-10 text-zinc-900 dark:text-white shrink-0">$200</div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ═══ FOOTER CTA ═══ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="relative"
        >
          <motion.div variants={fadeUp} className="rounded-[2rem] border border-zinc-200/80 dark:border-white/[0.06] bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-500/[0.06] dark:via-white/[0.02] dark:to-violet-500/[0.04] p-10 md:p-14 text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-[-100px] left-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/[0.08] blur-[100px] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-[-100px] right-[20%] w-[300px] h-[300px] rounded-full bg-violet-500/[0.08] blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white/95 mb-4 tracking-tight">{copy.footerCta}</h2>
              <Link href="/login">
                <Button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[15px] font-bold hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 group border-none mt-2">
                  {copy.footerCtaButton} <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-zinc-400 dark:text-white/25 font-medium">
            <p>© {new Date().getFullYear()} AutoFood. All rights reserved.</p>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
