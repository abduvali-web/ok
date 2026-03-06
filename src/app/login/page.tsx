'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChartColumnIncreasing,
  Eye,
  EyeOff,
  Loader2,
  Route,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const highlights = useMemo(
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
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
    <AuthShell
      badge="Professional delivery operations"
      headline="Sign in to the command layer behind orders, warehouse, and dispatch."
      description="This portal is built for operating teams who need the next decision to be obvious: what is delayed, what is failing, and what needs intervention now."
      highlights={highlights}
      cardTitle={t.auth.loginTitle}
      cardSubtitle="Enter the platform"
      footer={
        <div className="space-y-2 text-center text-xs text-slate-400">
          <p>
            No account?{' '}
            <Link href="/signup" className="font-medium text-white hover:underline">
              Start free trial
            </Link>
          </p>
          <p>
            <button
              type="button"
              className="hover:text-white hover:underline"
              onClick={() => toast.info('Policy pages coming soon.')}
            >
              {t.auth.privacyPolicy}
            </button>
            {' · '}
            <button
              type="button"
              className="hover:text-white hover:underline"
              onClick={() => toast.info('Policy pages coming soon.')}
            >
              {t.auth.termsOfUse}
            </button>
          </p>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            {t.auth.email}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@autofood.uz"
            className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-slate-400"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-200">
              {t.auth.password}
            </Label>
            <button
              type="button"
              className="text-xs text-slate-400 transition-colors hover:text-white"
              onClick={() => toast.info('Password recovery coming soon.')}
            >
              {t.auth.forgotPassword}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="h-11 rounded-xl border-white/10 bg-white/6 pr-10 text-white"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-white"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3efe6] text-[#08111d] hover:bg-white"
          disabled={isLoading}
        >
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
          <span className="bg-[#0d1726] px-3 text-[11px] uppercase tracking-widest text-slate-400">or</span>
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
        Continue with Google
      </Button>
    </AuthShell>
  )
}
