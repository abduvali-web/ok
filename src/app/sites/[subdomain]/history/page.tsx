'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock3, Loader2, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteClientNav, SitePageSurface, SitePanel, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

type HistoryOrder = {
  id: string
  orderNumber?: number
  orderStatus: string
  calories: number
  paymentStatus: string
  createdAt: string
  deliveryDate?: string
}

export default function ClientHistoryPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter()
  const { site, isLoading: siteLoading } = useSiteConfig(params.subdomain)

  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<HistoryOrder[]>([])

  useEffect(() => {
    if (siteLoading) return

    const load = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('customerToken')
        const response = await fetch('/api/customers/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        if (!response.ok) {
          throw new Error('Unable to load order history')
        }

        const data = await response.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customerInfo')
        router.push(makeClientSiteHref(params.subdomain, '/login'))
      } finally {
        setIsLoading(false)
      }
    }

    void load()
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
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ borderColor: 'var(--site-border)', color: 'var(--site-accent)' }}>
              <ReceiptText className="h-3.5 w-3.5" />
              Client records
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Order History</h1>
          </div>
          <div className="flex gap-2">
            <SiteClientNav subdomain={params.subdomain} currentPath={makeClientSiteHref(params.subdomain, '/history')} />
            <Button variant="outline" className="rounded-full" onClick={() => router.push(makeClientSiteHref(params.subdomain, '/client'))}>
              Back to client
            </Button>
          </div>
        </div>

        <SitePanel>
          {orders.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--site-muted)' }}>No order history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--site-border)' }}>
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Calories</th>
                    <th className="px-2 py-2 text-left">Payment</th>
                    <th className="px-2 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id} className="border-b" style={{ borderColor: 'var(--site-border)' }}>
                      <td className="px-2 py-2">{order.orderNumber || index + 1}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--site-accent-soft) 65%, white)' }}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-2 py-2">{order.calories}</td>
                      <td className="px-2 py-2">{order.paymentStatus}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(order.deliveryDate || order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SitePanel>
      </main>
    </SitePageSurface>
  )
}
