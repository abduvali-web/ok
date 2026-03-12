'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Globe2, Layers3, Phone, Route, ShieldCheck, WalletCards, ChevronRight, Sparkles } from 'lucide-react'

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

export default function LandingPage() {
  const { t, language } = useLanguage()
  const copy = localized[language]

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
      {/* Premium Multi-layer Background */}
      <div className="fixed inset-0 z-0 bg-white dark:bg-black pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-neutral-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-neutral-900/[0.8] dark:via-background dark:to-background pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-[800px] bg-gradient-to-b from-blue-500/[0.08] dark:from-blue-500/[0.04] via-transparent to-transparent pointer-events-none" />
      
      {/* Animated Hero Mesh */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-[100%] bg-blue-500/[0.1] dark:bg-blue-600/[0.05] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="fixed top-[10%] right-[-10%] w-[40%] h-[60%] rounded-[100%] bg-violet-500/[0.1] dark:bg-violet-600/[0.06] blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s', animationDuration: '8s' }} />
      <div className="fixed bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-[100%] bg-emerald-500/[0.08] dark:bg-emerald-600/[0.03] blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s', animationDuration: '10s' }} />

      {/* Floating Modern Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-6 px-4 pointer-events-none"
      >
        <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-[2rem] border border-black/10 dark:border-white/[0.08] bg-white/80 dark:bg-[#0c0c0c]/80 px-6 py-3 backdrop-blur-2xl shadow-md dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-white dark:to-white/80 text-white dark:text-black text-xs font-bold transition-all duration-300 group-hover:scale-110 shadow-md transform group-hover:shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.15)] dark:group-hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]">
              AF
            </div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white/90 group-hover:text-black dark:group-hover:text-white transition-colors">AutoFood</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <span className="text-[13px] font-bold text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-zinc-900 dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full">{copy.adminLogin}</span>
            </Link>
            <Link href="/login">
              <Button className="rounded-2xl h-10 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-neutral-200 shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 group border-none">
                {copy.openDashboard} <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-44 pb-32 space-y-32">
        {/* HERO SECTION */}
        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 dark:border-white/[0.08] bg-blue-50 dark:bg-white/[0.03] backdrop-blur-md text-[13px] font-bold text-blue-700 dark:text-white/70 mb-10 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 relative z-10" />
            <span className="relative z-10 tracking-wide">{copy.heroTag}</span>
          </motion.div>
          <motion.h1 
            variants={fadeUp}
            className="text-[3rem] sm:text-6xl md:text-[5rem] font-bold tracking-[-0.03em] text-zinc-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white/90 dark:to-white/40 mb-8 leading-[1.05]"
          >
            {copy.heroTitle}
          </motion.h1>
          <motion.p 
            variants={fadeUp}
            className="text-lg md:text-xl text-zinc-600 dark:text-white/40 max-w-2xl font-medium dark:font-light leading-relaxed mb-12"
          >
            {copy.heroDescription}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[15px] font-bold hover:bg-zinc-800 dark:hover:bg-neutral-100 hover:scale-[1.03] transition-all duration-300 active:scale-95 shadow-md dark:shadow-[0_0_30px_rgba(255,255,255,0.15)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] group border-none">
                {(t.common as any)?.login || copy.adminLogin} <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-black/10 dark:border-white/[0.12] bg-white/50 dark:bg-white/[0.03] text-zinc-800 dark:text-white hover:bg-white dark:hover:bg-white/[0.08] text-[15px] font-bold backdrop-blur-md transition-all duration-300 hover:border-black/20 dark:hover:border-white/20">
                <Phone className="mr-2.5 h-4 w-4 text-zinc-500 dark:text-white/40" />
                <span className="tracking-wide">+998 97 708 73 73</span>
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* BENTO GRID 1: Features */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid gap-6 md:grid-cols-3"
        >
          {copy.points.map((item, i) => {
            const Icon = item.icon
            const glows = ['bg-blue-500/5', 'bg-violet-500/5', 'bg-emerald-500/5']
            const darkGlows = ['dark:bg-blue-500/10', 'dark:bg-violet-500/10', 'dark:bg-emerald-500/10']
            const iconGlows = ['text-blue-500 dark:text-blue-400', 'text-violet-500 dark:text-violet-400', 'text-emerald-500 dark:text-emerald-400']
            
            return (
              <motion.div 
                key={item.title} 
                variants={fadeUp}
                className="group relative overflow-hidden rounded-[2rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0c0c]/80 p-8 hover:bg-white dark:hover:bg-white/[0.03] transition-all duration-500 hover:border-black/10 dark:hover:border-white/[0.1] shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl"
              >
                <div className={`absolute inset-0 ${glows[i % 3]} ${darkGlows[i % 3]} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl rounded-[2rem] transform scale-150 pointer-events-none`} />
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/[0.08] mb-8 backdrop-blur-md group-hover:scale-110 group-hover:bg-black/10 dark:group-hover:bg-white/[0.1] transition-all duration-500 shadow-sm">
                    <Icon className={`h-6 w-6 ${iconGlows[i % 3]} opacity-90 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-950 dark:text-white/95 mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-zinc-600 dark:text-white/40 leading-relaxed font-medium dark:font-light text-[15px]">{item.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.section>

        {/* BENTO GRID 2: Portal & Stats */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
        >
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0c0c]/80 p-8 md:p-12 shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl group hover:border-black/10 dark:hover:border-white/[0.1] transition-colors duration-500">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[400px] w-[400px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] opacity-60 dark:opacity-40 group-hover:opacity-100 dark:group-hover:opacity-60 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.04] font-bold text-zinc-600 dark:text-white/60 mb-8 backdrop-blur-md">
                <Globe2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="tracking-wide text-[12px]">{copy.portalLabel}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-950 dark:text-white/95 mb-5 tracking-tight leading-[1.1] max-w-[90%]">{copy.portalTitle}</h2>
              <p className="text-[17px] text-zinc-600 dark:text-white/40 leading-relaxed font-medium dark:font-light max-w-md mb-10">{copy.portalDescription}</p>
              
              <div className="space-y-4">
                {copy.promises.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-4 group/item">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/[0.08] group-hover/item:bg-black/10 dark:group-hover/item:bg-white/[0.1] transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-zinc-500 dark:text-white/60 group-hover/item:text-zinc-900 dark:group-hover/item:text-white group-hover/item:drop-shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:group-hover/item:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" />
                    </div>
                    <span className="text-zinc-600 dark:text-white/60 font-medium dark:font-light text-[15px] group-hover/item:text-zinc-950 dark:group-hover/item:text-white/80 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col justify-center rounded-[2rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0c0c]/80 p-8 hover:bg-white dark:hover:bg-white/[0.03] hover:border-black/10 dark:hover:border-white/[0.1] transition-all duration-500 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] dark:from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white mb-2 font-display">{stat.value}</p>
                <p className="text-[13px] text-zinc-500 dark:text-white/40 font-bold tracking-wide">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* BENTO GRID 3: Roles & Pricing */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid gap-6 lg:grid-cols-[1fr_1fr]"
        >
          {/* Roles Card */}
          <motion.div variants={fadeUp} className="rounded-[2rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0c0c]/80 p-8 md:p-12 flex flex-col shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-[-100px] left-[-100px] h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px] opacity-60 dark:opacity-40 group-hover:opacity-100 dark:group-hover:opacity-60 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-zinc-950 dark:text-white/95 tracking-tight">{copy.roleTitle}</h2>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="grid gap-4 flex-1">
                {copy.roles.map((role) => (
                  <div key={role.title} className="rounded-2xl border border-black/5 dark:border-white/[0.04] bg-white/80 dark:bg-white/[0.015] p-5 hover:bg-white dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/[0.08] shadow-sm transition-all duration-400">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white/90 mb-1 tracking-tight">{role.title}</h4>
                    <p className="text-[14px] text-zinc-500 dark:text-white/40 font-medium dark:font-light leading-relaxed">{role.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Pricing Card */}
          <motion.div variants={fadeUp} className="rounded-[2rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c0c0c]/80 p-8 md:p-12 flex flex-col justify-between shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[100px] opacity-60 dark:opacity-40 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-zinc-950 dark:text-white/95 mb-5 tracking-tight max-w-[80%] leading-[1.1]">{copy.pricingTitle}</h2>
              <p className="text-[16px] text-zinc-600 dark:text-white/40 font-medium dark:font-light leading-relaxed mb-10 max-w-sm">{copy.pricingDescription}</p>
            </div>
            
            <div className="space-y-4 relative z-10 block w-full self-stretch">
              <div className="group rounded-[1.5rem] border border-black/5 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-6 sm:p-8 flex items-center justify-between hover:bg-white dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/[0.1] transition-all duration-400 hover:shadow-md w-[100%] max-w-full">
                <div className="min-w-0 pr-4 shrink-1">
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white/90 tracking-tight">{copy.monthly}</h4>
                  <p className="text-[13px] text-zinc-500 dark:text-white/40 font-medium dark:font-light mt-1 flex-wrap break-words">{copy.monthlyNote}</p>
                </div>
                <div className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white shrink-0 ml-auto">$100</div>
              </div>
              <div className="group rounded-[1.5rem] border border-blue-500/30 bg-blue-50 dark:bg-blue-500/[0.08] p-6 sm:p-8 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-500/[0.12] transition-all duration-400 relative overflow-hidden shadow-md dark:shadow-none hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] w-[100%] max-w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 dark:from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 min-w-0 pr-4 shrink-1">
                  <h4 className="text-lg font-bold text-zinc-950 dark:text-white/95 tracking-tight flex items-center gap-3">
                    {copy.quarterly}
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-widest border border-blue-500/30">Popular</span>
                  </h4>
                  <p className="text-[13px] text-zinc-600 dark:text-white/40 font-medium dark:font-light mt-1 flex-wrap break-words">{copy.quarterlyNote}</p>
                </div>
                <div className="text-3xl font-bold tracking-tight relative z-10 text-zinc-950 dark:text-white shrink-0 ml-auto">$200</div>
              </div>
            </div>
          </motion.div>
        </motion.section>

      </main>
    </div>
  )
}
