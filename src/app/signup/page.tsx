'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function SignUpPage() {
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = useMemo(() => {
    const password = signupData.password
    let score = 0
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    return score
  }, [signupData.password])

  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/auth/redirect' })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Account created successfully.', {
          description: 'Your 30-day trial has started. Redirecting to login...',
        })

        setTimeout(() => {
          window.location.href = '/login'
        }, 1200)
      } else {
        setError(data.error || 'Failed to create account.')
        toast.error('Sign-up error', {
          description: data.error || 'Failed to create account.',
        })
      }
    } catch {
      setError('Could not connect to server.')
      toast.error('Connection error', {
        description: 'Could not connect to server.',
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-800 to-emerald-700" />
          <div className="absolute -left-12 top-20 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-14 text-white">
            <div className="space-y-5">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold">AutoFood</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-100/80">30-day trial</p>
                </div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-4"
              >
                <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-[-0.03em]">
                  Start your operations stack in minutes
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-emerald-50/85">
                  Create an account and immediately access the full dashboard with admin and courier workflows.
                </p>
              </motion.div>
            </div>

            <div className="grid gap-4">
              {[
                'Full product access during trial',
                'No card required to get started',
                'Structured onboarding for your team',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <p className="text-sm text-emerald-50/90">{item}</p>
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
                <CardTitle className="font-display text-3xl tracking-[-0.02em]">Create account</CardTitle>
                <CardDescription>Get full access with your 30-day trial.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="button" variant="outline" className="h-11 w-full" onClick={handleGoogleSignUp}>
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/75" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="bg-card px-3">Or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="h-11 pl-9"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 pl-9"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="h-11 pl-9"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>

                    {signupData.password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                i < passwordStrength ? strengthColors[Math.max(passwordStrength - 1, 0)] : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Strength: {strengthLabels[Math.max(passwordStrength - 1, 0)] || 'Too short'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="h-11 pl-9"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="btn-3d h-11 w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-2 border-t border-border/70 pt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to the{' '}
                  <button type="button" className="underline hover:text-primary" onClick={() => toast.info('Policy pages coming soon.')}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="underline hover:text-primary" onClick={() => toast.info('Policy pages coming soon.')}
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
