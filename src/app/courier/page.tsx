'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { CourierDashboard } from '@/components/courier/CourierDashboard'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Order {
    id: string
    orderNumber: number
    customer: {
        name: string
        phone: string
    }
    deliveryAddress: string
    deliveryTime: string
    quantity: number
    calories: number
    specialFeatures: string
    paymentStatus: string
    orderStatus: string
    isPrepaid: boolean
    latitude?: number
    longitude?: number
    createdAt: string
    deliveryDate?: string
}

export default function CourierPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('orders')
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/orders')
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
            } else {
                console.error('Failed to fetch orders')
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' })
    }

    // Handle tab changes
    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        // If we had other tabs implemented like history or profile, we would switch view here
        // For now we mainly focus on orders
    }

    return (
        <div className="min-h-screen bg-background pb-20">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold">{t.courier.title}</h1>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </header>

            {/* Main Content */}
            <main>
                {activeTab === 'orders' && (
                    <CourierDashboard
                        orders={orders}
                        onRefresh={fetchOrders}
                    />
                )}

                {activeTab === 'history' && (
                    <div className="p-4 text-center text-muted-foreground mt-10">
                        <h2 className="text-lg font-medium mb-2">{t.courier.history}</h2>
                        <p>{t.common.loading}...</p>
                        {/* Future implementation: Courier history */}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="p-4 text-center text-muted-foreground mt-10">
                        <h2 className="text-lg font-medium mb-2">{t.courier.profile}</h2>
                        <Button onClick={handleLogout} variant="destructive" className="mt-4">
                            {t.common.logout}
                        </Button>
                    </div>
                )}
            </main>

            {/* Mobile Navigation */}
            <MobileBottomNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="courier"
            />
        </div>
    )
}
