'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChartColumnIncreasing, Loader2, Route, ShieldCheck, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const roleRoutes: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  MIDDLE_ADMIN: '/middle-admin',
  LOW_ADMIN: '/low-admin',
  COURIER: '/courier',
}

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loginHighlights = useMemo(
    () => [
      { icon: Zap, label: 'Auto Orders', detail: 'Structured recurring order scheduling.' },
      { icon: Route, label: 'Dispatch', detail: 'Live routing, courier status, and delivery control.' },
      { icon: ChartColumnIncreasing, label: 'Finance', detail: 'Debt, salary, and company visibility.' },
    ],
    []
  )

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error')
    if (err) {
      toast.error(t.common.error, {
        description: err === 'Configuration' ? 'Server configuration error' : err,
      })
    }
  }, [t.common.error])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })

      if (result?.error) {
        toast.error(t.common.error, {
          description: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error,
        })
        return
      }

      const session = await getSession()
      const role = session?.user?.role
      const destination = roleRoutes[role ?? ''] ?? '/middle-admin'

      toast.success(t.common.success, { description: t.auth.welcome })
      router.replace(destination)
      router.refresh()
    } catch {
      toast.error(t.common.error, { description: 'Could not connect to server' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-command-center opacity-95" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(243,200,135,0.14),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(125,211,252,0.18),transparent_24%)]" />

      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-white/10 text-white lg:flex">
          <div className="flex w-full flex-col justify-between px-10 py-12">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-[11px] font-bold uppercase tracking-[0.28em]">
                  AF
                </span>
                <span>
                  <span className="block font-display text-xl tracking-tight">AutoFood</span>
                  <span className="block text-[10px] uppercase tracking-[0.26em] text-white/45">Operations access</span>
                </span>
              </Link>
            </div>

            <div className="animate-fade-in-up max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f3c887]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Professional delivery operations
              </div>
              <h1 className="mt-6 font-display text-5xl leading-[1] tracking-[-0.03em]">
                Sign in to the command layer behind orders, warehouse, and dispatch.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
                This portal is built for operating teams who need the next decision to be obvious: what is delayed, what is failing, and what needs intervention now.
              </p>

              <div className="mt-10 grid gap-4">
                {loginHighlights.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#f3c887]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.22em] text-white/35">
              &copy; {new Date().getFullYear()} AutoFood
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md animate-fade-in-up">
            <Link href="/" className="mb-8 block text-center font-display text-2xl font-semibold tracking-tight text-white lg:hidden">
              AutoFood
            </Link>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.94),rgba(11,23,40,0.92))] p-6 text-white shadow-[0_35px_90px_-50px_rgba(0,0,0,0.8)] sm:p-8">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#f3c887]">{t.auth.loginTitle}</p>
                <h1 className="mt-3 font-display text-3xl tracking-tight">Enter the platform</h1>
                <p className="mt-2 text-sm text-slate-300">{t.auth.loginSubtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">{t.auth.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@autofood.uz"
                    className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-slate-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200">{t.auth.password}</Label>
                    <button
                      type="button"
                      className="text-xs text-slate-400 transition-colors hover:text-white"
                      onClick={() => toast.info('Password recovery coming soon.')}
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    className="h-11 rounded-xl border-white/10 bg-white/6 text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="h-11 w-full rounded-full bg-[#f3efe6] text-[#08111d] hover:bg-white" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      {t.auth.signIn}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0d1726] px-3 text-[11px] uppercase tracking-widest text-slate-400">
                    or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-white/12 bg-white/4 text-white hover:bg-white/8 hover:text-white"
                onClick={() => signIn('google', { callbackUrl: '/auth/redirect' })}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>

              <div className="mt-8 space-y-2 text-center text-xs text-slate-400">
                <p>
                  No account?{' '}
                  <Link href="/signup" className="font-medium text-white hover:underline">
                    Start free trial
                  </Link>
                </p>
                <p>
                  <button type="button" className="hover:text-white hover:underline" onClick={() => toast.info('Policy pages coming soon.')}>
                    {t.auth.privacyPolicy}
                  </button>
                  {' · '}
                  <button type="button" className="hover:text-white hover:underline" onClick={() => toast.info('Policy pages coming soon.')}>
                    {t.auth.termsOfUse}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
