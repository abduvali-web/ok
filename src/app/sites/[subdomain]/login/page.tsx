'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { OtpAuthForm } from '@/components/site/OtpAuthForm'
import { SitePageSurface, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

export default function LoginPage({ params }: { params: { subdomain: string } }) {
    const router = useRouter()
    const { site, isLoading } = useSiteConfig(params.subdomain)

    useEffect(() => {
        // If customer already has a valid cookie session (shared across subdomains), skip OTP page.
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
                <OtpAuthForm
                    subdomain={params.subdomain}
                    purpose="login"
                    title="Login with Phone"
                    description="Enter your phone number and one-time SMS code."
                />
            </main>
        </SitePageSurface>
    )
}
