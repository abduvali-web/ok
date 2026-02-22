'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatWindow } from '@/components/site/ChatWindow'
import { SiteClientNav, SitePageSurface, SitePanel, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

type CustomerInfo = {
  name?: string
}

export default function ClientChatPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter()
  const { site, isLoading: siteLoading } = useSiteConfig(params.subdomain)
  const [isLoading, setIsLoading] = useState(true)
  const [customerName, setCustomerName] = useState('Client')

  useEffect(() => {
    if (siteLoading) return

    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.push(makeClientSiteHref(params.subdomain, '/login'))
      return
    }

    const info = localStorage.getItem('customerInfo')
    if (info) {
      try {
        const parsed = JSON.parse(info) as CustomerInfo
        if (parsed.name) {
          setCustomerName(parsed.name)
        }
      } catch {
        // Ignore malformed localStorage payload
      }
    }

    setIsLoading(false)
  }, [params.subdomain, router, siteLoading])

  if (siteLoading || isLoading || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <SitePageSurface site={site}>
      <SitePublicHeader site={site} />

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Community Chat</h1>
          <div className="flex gap-2">
            <SiteClientNav subdomain={params.subdomain} />
            <Button variant="outline" onClick={() => router.push(makeClientSiteHref(params.subdomain, '/client'))}>Back to client</Button>
          </div>
        </div>

        <SitePanel className="h-[560px]">
          <ChatWindow
            websiteId={site.id}
            customerName={customerName}
            mode="embedded"
            className="h-full border-0"
          />
        </SitePanel>
      </main>
    </SitePageSurface>
  )
}
