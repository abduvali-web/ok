'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Globe2, Layers3, Phone, Route, ShieldCheck, WalletCards } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-primary text-sm font-semibold text-primary-foreground">
              AF
            </span>
            <div>
              <p className="text-lg font-semibold">AutoFood</p>
              <p className="text-xs text-muted-foreground">{copy.platform}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="outline" size="sm">{copy.adminLogin}</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                {copy.openDashboard}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_390px]">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <p className="text-sm font-medium text-muted-foreground">{copy.heroTag}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{copy.heroTitle}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{copy.heroDescription}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login">
                <Button>
                  {t.common.login}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="tel:+998977087373">
                <Button variant="outline">
                  <Phone className="h-4 w-4" />
                  +998 97 708 73 73
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {copy.stats.map((item) => (
                <div key={item.label} className="rounded-md border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-base font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe2 className="h-4 w-4" />
              {copy.portalLabel}
            </div>
            <h2 className="mt-3 text-xl font-semibold">{copy.portalTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.portalDescription}</p>

            <div className="mt-5 space-y-3">
              {copy.promises.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-md border border-border bg-background p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {copy.points.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-lg border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.detail}</p>
              </div>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold">{copy.roleTitle}</h2>
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {copy.roleBadge}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {copy.roles.map((role) => (
                <div key={role.title} className="rounded-md border border-border bg-background p-4">
                  <p className="text-base font-semibold">{role.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{role.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold">{copy.pricingTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.pricingDescription}</p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">{copy.monthly}</p>
                <p className="mt-1 text-2xl font-semibold">$100</p>
                <p className="mt-2 text-sm text-muted-foreground">{copy.monthlyNote}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">{copy.quarterly}</p>
                <p className="mt-1 text-2xl font-semibold">$200</p>
                <p className="mt-2 text-sm text-muted-foreground">{copy.quarterlyNote}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
