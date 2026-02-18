'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSession, signIn } from 'next-auth/react'
import {
  ArrowRight,
  BarChart3,
  Loader2,
  Lock,
  Mail,
  Route,
  ShieldCheck,
  TimerReset,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const { t } = useLanguage()
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')

    if (!errorParam) return

    toast.error(t.common.error, {
      description: errorParam === 'Configuration' ? 'Server configuration error' : errorParam,
    })
  }, [t.common.error])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(t.common.error, {
          description: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error,
        })
      } else {
        const session = await getSession()
        const role = session?.user?.role

        toast.success(t.common.success, {
          description: t.auth.welcome,
        })

        setTimeout(() => {
          switch (role) {
            case 'SUPER_ADMIN':
              window.location.href = '/super-admin'
              break
            case 'MIDDLE_ADMIN':
              window.location.href = '/middle-admin'
              break
            case 'LOW_ADMIN':
              window.location.href = '/low-admin'
              break
            case 'COURIER':
              window.location.href = '/courier'
              break
            default:
              window.location.href = '/middle-admin'
          }
        }, 800)
      }
    } catch {
      toast.error(t.common.error, {
        description: 'Could not connect to server',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-gradient opacity-70" />

      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-border/70 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900" />
          <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-10 right-8 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-14 text-white">
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 backdrop-blur-md">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold">AutoFood</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-100/70">Operations Platform</p>
                </div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-4"
              >
                <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-[-0.03em]">
                  Run your delivery team without chaos
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-emerald-50/85">
                  Centralize dispatch, clients, warehouse planning, and finance in one real-time control system.
                </p>
              </motion.div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Role-Safe Access',
                  description: 'Granular permissions for admins and couriers.',
                },
                {
                  icon: TimerReset,
                  title: 'Auto-Order Scheduling',
                  description: 'Recurring orders generated and assigned automatically.',
                },
                {
                  icon: Route,
                  title: 'Smart Dispatch',
                  description: 'Live courier routing with map-based coordination.',
                },
                {
                  icon: BarChart3,
                  title: 'Performance Analytics',
                  description: 'Track on-time delivery, revenue, and team efficiency.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/15 p-2">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-emerald-50/75">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-16 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="glass-intense rounded-[1.4rem] border-border/70 shadow-elegant">
              <CardHeader className="space-y-2 pb-5 text-center">
                <CardTitle className="font-display text-3xl tracking-[-0.02em]">{t.auth.loginTitle}</CardTitle>
                <CardDescription className="text-sm">{t.auth.loginSubtitle}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@autofood.uz"
                        className="h-11 pl-9"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t.auth.password}</Label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => toast.info('Password recovery will be available soon.')}
                      >
                        {t.auth.forgotPassword}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="h-11 pl-9"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="btn-3d h-11 w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.common.loading}
                      </>
                    ) : (
                      <>
                        {t.auth.signIn}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/75" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="bg-card px-3">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => signIn('google', { callbackUrl: '/auth/redirect' })}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>

              <CardFooter className="flex-col gap-2 border-t border-border/70 pt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Do not have an account?{' '}
                  <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Start free trial
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Protected by reCAPTCHA.{' '}
                  <button type="button" className="underline hover:text-primary" onClick={() => toast.info('Policy pages coming soon.')}
                  >
                    {t.auth.privacyPolicy}
                  </button>{' '}
                  and{' '}
                  <button type="button" className="underline hover:text-primary" onClick={() => toast.info('Policy pages coming soon.')}
                  >
                    {t.auth.termsOfUse}
                  </button>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
