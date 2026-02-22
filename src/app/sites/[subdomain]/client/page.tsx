'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, MapPin, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SiteClientNav, SitePageSurface, SitePanel, SitePublicHeader } from '@/components/site/SiteScaffold'
import { useSiteConfig } from '@/hooks/useSiteConfig'
import { ChatWindow } from '@/components/site/ChatWindow'
import { makeClientSiteHref } from '@/lib/site-urls'

type CustomerProfile = {
  id: string
  name: string
  phone: string
  balance: number
  address: string
  calories: number
  autoOrdersEnabled: boolean
  googleMapsLink?: string
}

type Order = {
  id: string
  orderStatus: string
  calories: number
  deliveryTime?: string | null
}

type TodayMenuResponse = {
  menuNumber: number
  source: 'set' | 'default'
  setName: string | null
  dishes: Array<{
    id: number
    name: string
    mealType: string
    imageUrl: string
  }>
}

export default function ClientHomePage({ params }: { params: { subdomain: string } }) {
  const router = useRouter()
  const { site, isLoading: siteLoading } = useSiteConfig(params.subdomain)

  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [todayMenu, setTodayMenu] = useState<TodayMenuResponse | null>(null)
  const [googleMapsLink, setGoogleMapsLink] = useState('')
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [isTogglingPlan, setIsTogglingPlan] = useState(false)

  useEffect(() => {
    if (siteLoading) return

    const customerToken = localStorage.getItem('customerToken')
    if (!customerToken) {
      router.push(makeClientSiteHref(params.subdomain, '/login'))
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const authHeaders = { Authorization: `Bearer ${customerToken}` }

        const [profileRes, ordersRes, menuRes] = await Promise.all([
          fetch('/api/customers/profile', { headers: authHeaders }),
          fetch('/api/customers/orders', { headers: authHeaders }),
          fetch('/api/customers/today-menu', { headers: authHeaders }),
        ])

        if (!profileRes.ok) {
          throw new Error('Session expired. Please login again.')
        }

        const profileData = await profileRes.json()
        const ordersData = ordersRes.ok ? await ordersRes.json() : []
        const menuData = menuRes.ok ? await menuRes.json() : null

        setProfile(profileData)
        setGoogleMapsLink(profileData.googleMapsLink || '')
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setTodayMenu(menuData)
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : 'Failed to load client data')
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customerInfo')
        router.push(makeClientSiteHref(params.subdomain, '/login'))
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [params.subdomain, router, siteLoading])

  const activeOrder = useMemo(() => {
    return orders.find((order) => !['DELIVERED', 'FAILED', 'CANCELED', 'PAUSED'].includes(order.orderStatus)) || null
  }, [orders])

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerInfo')
    router.push(makeClientSiteHref(params.subdomain, '/login'))
  }

  const handleSaveLocation = async () => {
    const customerToken = localStorage.getItem('customerToken')
    if (!customerToken) return

    if (!googleMapsLink.trim()) {
      toast.error('Please paste Google Maps link or coordinates')
      return
    }

    setIsSavingLocation(true)
    try {
      const response = await fetch('/api/customers/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ googleMapsLink: googleMapsLink.trim() }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update location')
      }

      setProfile(data)
      setGoogleMapsLink(data.googleMapsLink || googleMapsLink)
      toast.success('Location saved')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to update location')
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handleTogglePlan = async (nextActive: boolean) => {
    const customerToken = localStorage.getItem('customerToken')
    if (!customerToken) return
    if (!profile) return

    setIsTogglingPlan(true)
    try {
      const response = await fetch('/api/customers/plan', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ active: nextActive }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update plan status')
      }

      setProfile((prev) => (prev ? { ...prev, autoOrdersEnabled: Boolean(data?.customer?.autoOrdersEnabled) } : prev))
      toast.success(nextActive ? 'Plan activated' : 'Plan deactivated')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to update plan status')
    } finally {
      setIsTogglingPlan(false)
    }
  }

  if (siteLoading || isLoading || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <SitePageSurface site={site}>
      <SitePublicHeader site={site} />

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {profile.name}</h1>
            <p className="text-sm" style={{ color: 'var(--site-muted)' }}>
              Phone: {profile.phone}
            </p>
          </div>

          <div className="flex gap-2">
            <SiteClientNav subdomain={params.subdomain} />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SitePanel>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-medium" style={{ color: 'var(--site-muted)' }}>Client Balance</h2>
                <p className="mt-1 text-3xl font-semibold">{(profile.balance || 0).toLocaleString()} UZS</p>
              </div>
              <Wallet className="h-5 w-5" style={{ color: 'var(--site-accent)' }} />
            </div>
          </SitePanel>

          <SitePanel>
            <h2 className="text-sm font-medium" style={{ color: 'var(--site-muted)' }}>Current Order</h2>
            {activeOrder ? (
              <div className="mt-2 space-y-1 text-sm">
                <p>Status: <strong>{activeOrder.orderStatus}</strong></p>
                <p>Calories: {activeOrder.calories}</p>
                <p>Time: {activeOrder.deliveryTime || 'Not set'}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: 'var(--site-muted)' }}>No active order right now.</p>
            )}
          </SitePanel>
        </div>

        <SitePanel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium" style={{ color: 'var(--site-muted)' }}>Plan Status</h2>
              <p className="mt-1 text-lg font-semibold">
                {profile.autoOrdersEnabled ? 'Active' : 'Inactive'}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--site-muted)' }}>
                When inactive, future auto-orders will be paused and won&apos;t be delivered.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={profile.autoOrdersEnabled}
                onCheckedChange={(checked) => void handleTogglePlan(Boolean(checked))}
                disabled={isTogglingPlan}
              />
            </div>
          </div>
        </SitePanel>

        <SitePanel>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Today Menu</h2>
              <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
                Day #{todayMenu?.menuNumber || '-'}
                {todayMenu?.source === 'set' && todayMenu.setName ? ` - Set: ${todayMenu.setName}` : ''}
              </p>
            </div>
          </div>

          {todayMenu?.dishes?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {todayMenu.dishes.map((dish) => (
                <div
                  key={`${dish.id}-${dish.mealType}`}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--site-border)', backgroundColor: 'var(--site-bg)' }}
                >
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--site-muted)' }}>{dish.mealType}</p>
                  <p className="mt-1 font-medium">{dish.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--site-muted)' }}>Menu is not available yet.</p>
          )}
        </SitePanel>

        <SitePanel>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--site-muted)' }}>
            Paste a Google Maps link or coordinates to save your location.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="mapsLink" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Google Maps Link
              </Label>
              <Input
                id="mapsLink"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="https://maps.google.com/?q=41.311081,69.240562"
              />
              <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
                Current address: {profile.address || 'Not set'}
              </p>
            </div>

            <Button onClick={handleSaveLocation} disabled={isSavingLocation} className="self-end">
              {isSavingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save location'}
            </Button>
          </div>
        </SitePanel>
      </main>

      {site.chatEnabled && site.id && (
        <ChatWindow websiteId={site.id} customerName={profile.name} />
      )}
    </SitePageSurface>
  )
}
