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
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-background to-background pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-[100px] pointer-events-none" />

      {/* Floating Modern Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-6 px-4 pointer-events-none"
      >
        <div className="pointer-events-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl shadow-2xl">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black text-xs font-bold transition-transform group-hover:scale-110">
              AF
            </div>
            <span className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">AutoFood</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <span className="text-sm font-medium text-white/60 hover:text-white transition-colors">{copy.adminLogin}</span>
            </Link>
            <Link href="/login">
              <Button className="rounded-full bg-white text-black hover:bg-neutral-200 shadow-lg transition-transform hover:scale-105 active:scale-95">
                {copy.openDashboard} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-40 pb-24 space-y-24">
        {/* HERO SECTION */}
        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {copy.heroTag}
          </motion.div>
          <motion.h1 
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm mb-6 leading-tight"
          >
            {copy.heroTitle}
          </motion.h1>
          <motion.p 
            variants={fadeUp}
            className="text-lg md:text-xl text-white/50 max-w-2xl font-light leading-relaxed mb-10"
          >
            {copy.heroDescription}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button className="h-12 px-8 rounded-full bg-white text-black text-base hover:bg-neutral-200 hover:scale-105 transition-all active:scale-95">
                {(t.common as any)?.login || copy.adminLogin} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline" className="h-12 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 text-base backdrop-blur-md transition-all">
                <Phone className="mr-2 h-4 w-4 text-white/50" />
                +998 97 708 73 73
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
            return (
              <motion.div 
                key={item.title} 
                variants={fadeUp}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mb-6 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/90 mb-3">{item.title}</h3>
                  <p className="text-white/50 leading-relaxed font-light">{item.detail}</p>
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
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[80px] opacity-50" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/70 mb-6">
                <Globe2 className="h-3.5 w-3.5" />
                {copy.portalLabel}
              </div>
              <h2 className="text-3xl font-semibold text-white/90 mb-4 tracking-tight">{copy.portalTitle}</h2>
              <p className="text-lg text-white/50 leading-relaxed font-light max-w-md mb-8">{copy.portalDescription}</p>
              
              <div className="space-y-4">
                {copy.promises.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-white/70 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
                <p className="text-3xl font-bold tracking-tight text-white/90 mb-2">{stat.value}</p>
                <p className="text-sm text-white/50 font-light">{stat.label}</p>
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
          <motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white/90">{copy.roleTitle}</h2>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="grid gap-4 flex-1">
              {copy.roles.map((role) => (
                <div key={role.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.05] transition-colors">
                  <h4 className="text-lg font-medium text-white/90 mb-1">{role.title}</h4>
                  <p className="text-sm text-white/50 font-light">{role.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white/90 mb-4">{copy.pricingTitle}</h2>
              <p className="text-white/50 font-light leading-relaxed mb-8">{copy.pricingDescription}</p>
            </div>
            
            <div className="space-y-4">
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex justify-between items-center hover:bg-white/[0.06] transition-all cursor-pointer">
                <div>
                  <h4 className="text-lg font-medium text-white/90">{copy.monthly}</h4>
                  <p className="text-sm text-white/50 font-light">{copy.monthlyNote}</p>
                </div>
                <div className="text-3xl font-bold tracking-tight text-white">$100</div>
              </div>
              <div className="group rounded-2xl border border-primary/30 bg-primary/5 p-6 flex justify-between items-center hover:bg-primary/10 transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <h4 className="text-lg font-medium text-white/90 flex items-center gap-2">
                    {copy.quarterly}
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] text-primary font-bold uppercase tracking-wider">Popular</span>
                  </h4>
                  <p className="text-sm text-white/50 font-light">{copy.quarterlyNote}</p>
                </div>
                <div className="text-3xl font-bold tracking-tight relative z-10 text-white">$200</div>
              </div>
            </div>
          </motion.div>
        </motion.section>

      </main>
    </div>
  )
}
