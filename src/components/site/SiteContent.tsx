'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Check,
    Heart,
    Leaf,
    LogIn,
    MessageCircle,
    Shield,
    UserPlus,
    Wallet,
    Zap,
} from 'lucide-react'
import { GeneratedSiteContent } from '@/lib/ai-site-generator'
import { makeClientSiteHref } from '@/lib/site-urls'

const iconMap: Record<string, any> = {
    Zap,
    Shield,
    Heart,
    Leaf,
    MessageCircle,
    Wallet,
}

interface SiteContentProps {
    content: GeneratedSiteContent
    subdomain: string
    siteName: string
}

export function SiteContent({ content, subdomain, siteName }: SiteContentProps) {
    const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('en')

    const t = (obj: { uz: string; ru: string; en: string }) => obj[lang]
    const href = (path: string) => makeClientSiteHref(subdomain, path)

    return (
        <div style={{ backgroundColor: 'var(--site-bg)', color: 'var(--site-text)' }}>
            <nav
                className="sticky top-0 z-40 border-b backdrop-blur"
                style={{
                    borderColor: 'var(--site-border)',
                    backgroundColor: 'color-mix(in srgb, var(--site-panel) 92%, transparent)',
                }}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="text-lg font-semibold tracking-tight">{siteName}</div>

                    <div className="flex items-center gap-2">
                        {(['uz', 'ru', 'en'] as const).map((language) => (
                            <Button
                                key={language}
                                variant={lang === language ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setLang(language)}
                                className="w-9 uppercase"
                            >
                                {language}
                            </Button>
                        ))}

                        <Link href={href('/login')}>
                            <Button size="sm" variant="outline" className="gap-1">
                                <LogIn className="h-4 w-4" /> Login
                            </Button>
                        </Link>
                        <Link href={href('/register')}>
                            <Button size="sm" variant="outline" className="gap-1">
                                <UserPlus className="h-4 w-4" /> Register
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <section
                className="border-b"
                style={{
                    borderColor: 'var(--site-border)',
                    backgroundImage: 'linear-gradient(140deg, var(--site-hero-from), var(--site-hero-to))',
                    color: 'var(--site-hero-text)',
                }}
            >
                <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-[1fr_280px] md:items-end md:py-20">
                    <div>
                        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
                            {t(content.hero.title)}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base md:text-lg">{t(content.hero.subtitle)}</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href={href('/client')}>
                                <Button size="lg" className="rounded-full px-7">{t(content.hero.cta)}</Button>
                            </Link>
                        </div>
                    </div>

                    <div
                        className="rounded-3xl border p-4 text-sm backdrop-blur-sm"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--site-hero-text) 24%, transparent)',
                            backgroundColor: 'color-mix(in srgb, var(--site-hero-text) 10%, transparent)',
                            color: 'color-mix(in srgb, var(--site-hero-text) 88%, transparent)',
                        }}
                    >
                        <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Live Features</p>
                        <div className="mt-2 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Balance, History, Client Area</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14">
                <div className="grid gap-4 md:grid-cols-3">
                    {content.features.map((feature, index) => {
                        const Icon = iconMap[feature.icon] || Zap
                        return (
                            <Card
                                key={index}
                                style={{
                                    backgroundColor: 'var(--site-panel)',
                                    borderColor: 'var(--site-border)',
                                }}
                            >
                                <CardHeader>
                                    <div
                                        className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: 'var(--site-accent-soft)', color: 'var(--site-accent)' }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg">{t(feature.title)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm" style={{ color: 'var(--site-muted)' }}>{t(feature.description)}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-16">
                <h2 className="mb-6 text-2xl font-semibold">Available pages</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { href: href(''), label: 'Landing' },
                        { href: href('/login'), label: 'Login' },
                        { href: href('/register'), label: 'Register' },
                        { href: href('/client'), label: 'Client Home' },
                        { href: href('/history'), label: 'History' },
                    ].map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div
                                className="rounded-xl border p-4 transition-colors hover:bg-black/5"
                                style={{ borderColor: 'var(--site-border)', backgroundColor: 'var(--site-panel)' }}
                            >
                                <p className="font-medium">{item.label}</p>
                                <p className="mt-1 text-xs" style={{ color: 'var(--site-muted)' }}>{item.href}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-20">
                <h2 className="mb-4 text-2xl font-semibold">{t(content.about.title)}</h2>
                <p className="max-w-3xl" style={{ color: 'var(--site-muted)' }}>{t(content.about.description)}</p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {content.pricing.map((plan, index) => (
                        <Card
                            key={index}
                            style={{
                                backgroundColor: 'var(--site-panel)',
                                borderColor: 'var(--site-border)',
                            }}
                        >
                            <CardHeader>
                                <CardTitle>{t(plan.name)}</CardTitle>
                                <p className="text-2xl font-semibold" style={{ color: 'var(--site-accent)' }}>{plan.price}</p>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start gap-2 text-sm" style={{ color: 'var(--site-muted)' }}>
                                            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--site-accent)' }} />
                                            {t(feature)}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    )
}
