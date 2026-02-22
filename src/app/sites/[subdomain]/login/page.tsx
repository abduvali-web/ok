'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SitePageSurface, SitePanel, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

function normalizePhone(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const digits = trimmed.startsWith('+') ? trimmed.slice(1).replace(/\D/g, '') : trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return `+${digits}`
}

export default function LoginPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter()
  const { site, isLoading } = useSiteConfig(params.subdomain)
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone])

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('customerToken')
        const res = await fetch('/api/customers/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.ok) {
          router.replace(makeClientSiteHref(params.subdomain, '/client'))
        }
      } catch {
        // ignore
      }
    }

    void run()
  }, [params.subdomain, router])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!normalizedPhone) {
      toast.error('Enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sites/${params.subdomain}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Login failed')
      }

      localStorage.setItem('customerToken', data.token)
      localStorage.setItem('customerInfo', JSON.stringify(data.customer))
      toast.success('Login successful')
      router.push(makeClientSiteHref(params.subdomain, '/client'))
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <SitePageSurface site={site}>
      <SitePublicHeader site={site} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href={makeClientSiteHref(params.subdomain, '')} className="underline">Back to landing</Link>
        </div>
        <SitePanel className="mx-auto w-full max-w-lg space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Login with Phone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your phone number to login. No OTP verification is required.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998901234567"
              />
            </div>

            <Button type="submit" disabled={isSubmitting || !normalizedPhone} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Login
            </Button>
          </form>
        </SitePanel>
      </main>
    </SitePageSurface>
  )
}

