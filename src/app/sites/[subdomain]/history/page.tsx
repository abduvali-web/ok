'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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

    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.push(makeClientSiteHref(params.subdomain, '/login'))
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/customers/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Unable to load order history')
        }

        const data = await response.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customerInfo')
        router.push(makeClientSiteHref(params.subdomain, '/login'))
      } finally {
        setIsLoading(false)
      }
    }

    load()
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
          <h1 className="text-2xl font-semibold">Order History</h1>
          <div className="flex gap-2">
            <SiteClientNav subdomain={params.subdomain} />
            <Button variant="outline" onClick={() => router.push(makeClientSiteHref(params.subdomain, '/client'))}>Back to client</Button>
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
                      <td className="px-2 py-2">{order.orderStatus}</td>
                      <td className="px-2 py-2">{order.calories}</td>
                      <td className="px-2 py-2">{order.paymentStatus}</td>
                      <td className="px-2 py-2">{new Date(order.deliveryDate || order.createdAt).toLocaleDateString()}</td>
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
