'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Phone,
    MapPin,
    Navigation,
    Pause,
    Play,
    CheckCircle2,
    Package,
    Clock,
    User,
    ChevronRight,
    DollarSign,
    Loader2
} from 'lucide-react'
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
}

interface CourierDashboardProps {
    orders: Order[]
    onRefresh: () => void
}

export function CourierDashboard({ orders, onRefresh }: CourierDashboardProps) {
    const { t } = useLanguage()
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0)
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [amountReceived, setAmountReceived] = useState('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const activeOrders = orders.filter(o =>
        ['PENDING', 'IN_DELIVERY', 'PAUSED'].includes(o.orderStatus)
    )

    const currentOrder = activeOrders[currentOrderIndex]

    const handleOrderAction = async (orderId: string, action: string, additionalData?: Record<string, unknown>) => {
        setIsLoading(action)
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...additionalData })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Ошибка')
            }

            toast.success(
                action === 'start_delivery' ? 'Доставка начата' :
                    action === 'pause_delivery' ? 'Доставка приостановлена' :
                        action === 'resume_delivery' ? 'Доставка возобновлена' :
                            action === 'complete_delivery' ? 'Заказ завершен' : 'Успешно'
            )

            onRefresh()
            setShowPaymentModal(false)
            setAmountReceived('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ошибка')
        } finally {
            setIsLoading(null)
        }
    }

    const openMaps = (order: Order) => {
        const address = encodeURIComponent(order.deliveryAddress)
        const url = order.latitude && order.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${address}`
        window.open(url, '_blank')
    }

    const callCustomer = (phone: string) => {
        window.location.href = `tel:${phone}`
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="mobile-badge mobile-badge-default">{t.admin.filterGroups.pending}</Badge>
            case 'IN_DELIVERY':
                return <Badge className="mobile-badge mobile-badge-info">{t.admin.filterGroups.inDelivery}</Badge>
            case 'PAUSED':
                return <Badge className="mobile-badge mobile-badge-warning">{t.admin.table.paused}</Badge>
            case 'DELIVERED':
                return <Badge className="mobile-badge mobile-badge-success">{t.admin.filterGroups.delivered}</Badge>
            default:
                return <Badge className="mobile-badge mobile-badge-default">{status}</Badge>
        }
    }

    if (activeOrders.length === 0) {
        return (
            <div className="mobile-empty-state">
                <Package className="mobile-empty-icon" />
                <h3 className="mobile-empty-title">{t.courier.noOrders}</h3>
                <p className="mobile-empty-text">
                    Нет активных заказов на доставку
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Status bar */}
            <div className="courier-status-bar mx-4 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                        {t.courier.todayOrders}: {activeOrders.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {activeOrders.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentOrderIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentOrderIndex ? 'bg-primary w-4' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Current Order Card */}
            <AnimatePresence mode="wait">
                {currentOrder && (
                    <motion.div
                        key={currentOrder.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="courier-order-card"
                    >
                        {/* Order Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold">
                                        {t.courier.orderNumber}{currentOrder.orderNumber}
                                    </h2>
                                    {getStatusBadge(currentOrder.orderStatus)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {currentOrder.deliveryTime}
                                </p>
                            </div>
                            <Badge variant={currentOrder.isPrepaid ? 'default' : 'secondary'}>
                                {currentOrder.isPrepaid ? t.common.paid : t.common.notPaid}
                            </Badge>
                        </div>

                        {/* Customer Info */}
                        <div className="mobile-card-professional p-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{currentOrder.customer.name}</p>
                                    <p className="text-sm text-muted-foreground">{currentOrder.customer.phone}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="btn-mobile-icon"
                                    onClick={() => callCustomer(currentOrder.customer.phone)}
                                >
                                    <Phone className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="mobile-card-professional p-3 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">{t.courier.deliveryAddress}</p>
                                    <p className="font-medium text-sm">{currentOrder.deliveryAddress}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="btn-mobile-icon"
                                    onClick={() => openMaps(currentOrder)}
                                >
                                    <Navigation className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="mobile-stat-card">
                                <div className="mobile-stat-icon bg-green-500/10">
                                    <Package className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <div className="mobile-stat-value">{currentOrder.quantity}</div>
                                    <div className="mobile-stat-label">{t.common.quantity}</div>
                                </div>
                            </div>
                            <div className="mobile-stat-card">
                                <div className="mobile-stat-icon bg-orange-500/10">
                                    <span className="text-orange-500 font-bold text-sm">ккал</span>
                                </div>
                                <div>
                                    <div className="mobile-stat-value">{currentOrder.calories}</div>
                                    <div className="mobile-stat-label">{t.common.calories}</div>
                                </div>
                            </div>
                        </div>

                        {/* Special Features */}
                        {currentOrder.specialFeatures && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 mb-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ {currentOrder.specialFeatures}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="courier-action-buttons">
                            {currentOrder.orderStatus === 'PENDING' && (
                                <>
                                    <Button
                                        className="courier-action-btn primary col-span-2"
                                        onClick={() => handleOrderAction(currentOrder.id, 'start_delivery')}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === 'start_delivery' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" />
                                                {t.courier.startDelivery}
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {currentOrder.orderStatus === 'IN_DELIVERY' && (
                                <>
                                    <Button
                                        className="courier-action-btn warning"
                                        onClick={() => handleOrderAction(currentOrder.id, 'pause_delivery')}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === 'pause_delivery' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Pause className="w-5 h-5" />
                                                {t.courier.pauseDelivery}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        className="courier-action-btn success"
                                        onClick={() => setShowPaymentModal(true)}
                                        disabled={isLoading !== null}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {t.courier.completeDelivery}
                                    </Button>
                                </>
                            )}

                            {currentOrder.orderStatus === 'PAUSED' && (
                                <>
                                    <Button
                                        className="courier-action-btn primary"
                                        onClick={() => handleOrderAction(currentOrder.id, 'resume_delivery')}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === 'resume_delivery' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" />
                                                {t.courier.resumeDelivery}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        className="courier-action-btn success"
                                        onClick={() => setShowPaymentModal(true)}
                                        disabled={isLoading !== null}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {t.courier.completeDelivery}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Navigation buttons for multiple orders */}
                        {activeOrders.length > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentOrderIndex === 0}
                                >
                                    {t.common.back}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {currentOrderIndex + 1} / {activeOrders.length}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentOrderIndex(prev => Math.min(activeOrders.length - 1, prev + 1))}
                                    disabled={currentOrderIndex === activeOrders.length - 1}
                                >
                                    {t.common.next}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && currentOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
                        onClick={() => setShowPaymentModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="bg-background w-full md:w-[400px] md:rounded-2xl mobile-sheet"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="mobile-sheet-handle" />
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{t.courier.completeDelivery}</h3>
                                <p className="text-muted-foreground mb-6">
                                    {t.courier.orderNumber}{currentOrder.orderNumber}
                                </p>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Сумма получена (UZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        placeholder={currentOrder.isPrepaid ? 'Предоплачено' : '0'}
                                        className="mobile-input w-full border rounded-xl"
                                    />
                                    {currentOrder.isPrepaid && (
                                        <p className="text-sm text-green-600 mt-2">✓ Заказ уже оплачен</p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 btn-mobile-lg"
                                        onClick={() => setShowPaymentModal(false)}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        className="flex-1 btn-mobile-lg bg-green-500 hover:bg-green-600"
                                        onClick={() => handleOrderAction(currentOrder.id, 'complete_delivery', {
                                            amountReceived: amountReceived ? parseFloat(amountReceived) : 0
                                        })}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === 'complete_delivery' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                Завершить
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
