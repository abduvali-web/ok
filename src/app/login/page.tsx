'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { ArrowRight, Loader2, Zap, Route, ChartColumnIncreasing } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      } else {
        const session = await getSession()
        const role = session?.user?.role

        toast.success(t.common.success, { description: t.auth.welcome })

        setTimeout(() => {
          const routes: Record<string, string> = {
            SUPER_ADMIN: '/super-admin',
            MIDDLE_ADMIN: '/middle-admin',
            LOW_ADMIN: '/low-admin',
            COURIER: '/courier',
          }
          window.location.href = routes[role ?? ''] ?? '/middle-admin'
        }, 600)
      }
    } catch {
      toast.error(t.common.error, { description: 'Could not connect to server' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Left: Brand Panel (desktop only) ─── */}
      <div className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex lg:w-[45%]">
        <div>
          <Link href="/" className="inline-block text-xl font-semibold tracking-tight">
            AutoFood
          </Link>
        </div>

        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Your delivery
            <br />
            command center.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-60">
            Orders, couriers, warehouse and finance — all in one place. Built for teams that move fast.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, label: 'Auto Orders', detail: 'Smart daily scheduling' },
              { icon: Route, label: 'Live Dispatch', detail: 'Real-time tracking' },
              { icon: ChartColumnIncreasing, label: 'Finance', detail: 'Complete overview' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 opacity-70">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/10">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs opacity-60">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs opacity-40">
          &copy; {new Date().getFullYear()} AutoFood. Built for delivery teams.
        </p>
      </div>

      {/* ─── Right: Login Form ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="absolute right-4 top-4 z-10">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <Link href="/" className="mb-10 block text-center font-display text-lg font-semibold tracking-tight lg:hidden">
            AutoFood
          </Link>

          <h1 className="text-center font-display text-2xl font-bold tracking-tight">
            {t.auth.loginTitle}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t.auth.loginSubtitle}
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@autofood.uz"
                className="h-11 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.auth.password}</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => toast.info('Password recovery coming soon.')}
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                className="h-11 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="h-11 w-full rounded-xl text-sm" disabled={isLoading}>
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

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
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

          <div className="mt-8 space-y-2 text-center text-xs text-muted-foreground">
            <p>
              No account?{' '}
              <Link href="/signup" className="font-medium text-foreground hover:underline">
                Start free trial
              </Link>
            </p>
            <p>
              <button type="button" className="hover:underline" onClick={() => toast.info('Policy pages coming soon.')}>
                {t.auth.privacyPolicy}
              </button>
              {' · '}
              <button type="button" className="hover:underline" onClick={() => toast.info('Policy pages coming soon.')}>
                {t.auth.termsOfUse}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
