'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Loader2, NotebookTabs, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SitePanel, SitePageSurface, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

function normalizePhone(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const digits = trimmed.startsWith('+') ? trimmed.slice(1).replace(/\D/g, '') : trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return `+${digits}`
}

export default function RegisterPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter()
  const { site, isLoading } = useSiteConfig(params.subdomain)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-lg font-medium">Site not found</p>
          <Link href="/" className="mt-2 inline-block underline">Back to home</Link>
        </div>
      </div>
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!normalizedPhone) {
      toast.error('Enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sites/${params.subdomain}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: name.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Registration failed')
      }

      toast.success('Registered. Now login with your phone number.')
      router.replace(makeClientSiteHref(params.subdomain, '/login'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SitePageSurface site={site}>
      <SitePublicHeader site={site} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href={makeClientSiteHref(params.subdomain, '')} className="underline">Back to landing</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <SitePanel className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ borderColor: 'var(--site-border)', color: 'var(--site-accent)' }}>
              <NotebookTabs className="h-3.5 w-3.5" />
              New client registration
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Create your client access</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: 'var(--site-muted)' }}>
                Register once with your name and phone number, then use the same number to enter your portal, monitor balance, and manage your delivery plan.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.4rem] border p-4" style={{ borderColor: 'var(--site-border)', backgroundColor: 'color-mix(in srgb, var(--site-accent-soft) 52%, white)' }}>
                <p className="font-medium">Simple onboarding</p>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--site-muted)' }}>
                  Name is optional. Phone number is the primary account identifier.
                </p>
              </div>
              <div className="rounded-[1.4rem] border p-4" style={{ borderColor: 'var(--site-border)', backgroundColor: 'color-mix(in srgb, var(--site-accent-soft) 52%, white)' }}>
                <ArrowRight className="h-5 w-5" style={{ color: 'var(--site-accent)' }} />
                <p className="mt-3 font-medium">Next step</p>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--site-muted)' }}>
                  After registration, continue directly to login and open the client dashboard.
                </p>
              </div>
            </div>
          </SitePanel>

          <SitePanel className="mx-auto w-full max-w-lg space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Register</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--site-muted)' }}>
                Registration and login are both handled by phone number.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                />
              </div>

              <Button type="submit" disabled={isSubmitting || !normalizedPhone} className="w-full gap-2 rounded-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Register
              </Button>
            </form>
          </SitePanel>
        </div>
      </main>
    </SitePageSurface>
  )
}
