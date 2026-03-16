'use client'

import type React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Admin, Client, Order } from '@/components/admin/dashboard/types'
import { formatLatLng } from '@/lib/geo'
import { MiniLocationPickerMap } from '@/components/admin/dashboard/shared/MiniLocationPickerMap'

export type OrderFormData = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryTime: string
  quantity: number
  calories: number
  specialFeatures: string
  paymentStatus: string
  paymentMethod: string
  isPrepaid: boolean
  selectedClientId: string
  latitude: number | null
  longitude: number | null
  courierId: string
  assignedSetId: string
}

export function OrderModal({
  open,
  onOpenChange,
  editingOrderId,
  setEditingOrderId,
  orderFormData,
  setOrderFormData,
  editingOrder,
  clients,
  couriers,
  availableSets,
  orderError,
  isCreatingOrder,
  onSubmit,
  onClientSelect,
  onAddressChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingOrderId: string | null
  setEditingOrderId: (next: string | null) => void
  orderFormData: OrderFormData
  setOrderFormData: React.Dispatch<React.SetStateAction<OrderFormData>>
  editingOrder: Order | null
  clients: Client[]
  couriers: Admin[]
  availableSets: any[]
  orderError: string
  isCreatingOrder: boolean
  onSubmit: (event: React.FormEvent | React.MouseEvent) => void | Promise<void>
  onClientSelect: (clientId: string) => void
  onAddressChange: (value: string) => void
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0)

  const matchedClient: Client | undefined = (() => {
    if (orderFormData.selectedClientId && orderFormData.selectedClientId !== 'manual') {
      return clients.find((c) => c.id === orderFormData.selectedClientId)
    }
    // Edit flow doesn't bind selectedClientId; fallback to phone match.
    const phone = (orderFormData.customerPhone || '').trim()
    if (!phone) return undefined
    return clients.find((c) => (c.phone || '').trim() === phone)
  })()

  const clientBalance = typeof matchedClient?.balance === 'number' ? matchedClient.balance : 0
  const dailyPrice = typeof matchedClient?.dailyPrice === 'number' ? matchedClient.dailyPrice : 0
  const qty = Number.isFinite(orderFormData.quantity) && orderFormData.quantity > 0 ? orderFormData.quantity : 1
  const orderCost = dailyPrice * qty

  const isCashLike = orderFormData.paymentMethod === 'CASH' || orderFormData.paymentMethod === 'CARD'
  const isDelivered = editingOrder?.orderStatus === 'DELIVERED'
  const amountReceived = typeof editingOrder?.amountReceived === 'number' ? editingOrder.amountReceived : 0

  const amountValue = (() => {
    if (!isCashLike) return null
    if (isDelivered) return amountReceived - orderCost
    return clientBalance > 0 ? clientBalance : 0
  })()

  const orderPoint =
    typeof orderFormData.latitude === 'number' && typeof orderFormData.longitude === 'number'
      ? { lat: orderFormData.latitude, lng: orderFormData.longitude }
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingOrderId ? 'Редактировать Заказ' : 'Создать Новый Заказ'}</DialogTitle>
          <DialogDescription>
            {editingOrderId
              ? 'Измените данные заказа'
              : 'Заполните информацию о новом заказе. Вы можете выбрать клиента из списка для автозаполнения данных.'}
          </DialogDescription>
          {!editingOrderId && orderFormData.selectedClientId && orderFormData.selectedClientId !== 'manual' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-xs text-green-800">✅ Данные клиента заполнены автоматически</p>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={onSubmit as any}>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="clientSelect" className="text-right">
                  Выбрать клиента
                </Label>
                <div className="col-span-3">
                  <Select value={orderFormData.selectedClientId} onValueChange={onClientSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите клиента из списка или введите данные вручную" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">-- Ввести данные вручную --</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 mt-1">Выберите клиента для автозаполнения</p>
                </div>
              </div>

              {availableSets.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="orderSet" className="text-right">
                    Сет
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={orderFormData.assignedSetId || 'none'}
                      onValueChange={(value) =>
                        setOrderFormData((prev) => ({ ...prev, assignedSetId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите сет (опционально)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Не выбирать --</SelectItem>
                        {availableSets.map((set: any) => (
                          <SelectItem key={set.id} value={set.id}>
                            {set.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">Если выбрать сет, он будет закреплён за клиентом</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="customerName" className="text-right">
                  Имя клиента
                  {orderFormData.selectedClientId && <span className="text-xs text-green-600 ml-1">✓</span>}
                </Label>
                <Input
                  id="customerName"
                  value={orderFormData.customerName}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className={`col-span-3 ${orderFormData.selectedClientId ? 'border-green-200 bg-green-50' : ''}`}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="customerPhone" className="text-right">
                  Телефон клиента
                  {orderFormData.selectedClientId && <span className="text-xs text-green-600 ml-1">✓</span>}
                </Label>
                <div className="col-span-3">
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="+998 XX XXX XX XX"
                    value={orderFormData.customerPhone}
                    onChange={(e) => setOrderFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    className={orderFormData.selectedClientId ? 'border-green-200 bg-green-50' : ''}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Формат: +998 XX XXX XX XX</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="deliveryAddress" className="text-right">
                  Адрес доставки
                  {orderFormData.selectedClientId && <span className="text-xs text-green-600 ml-1">✓</span>}
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="relative">
                    <Input
                      id="deliveryAddress"
                      value={orderFormData.deliveryAddress}
                      onChange={(e) => onAddressChange(e.target.value)}
                      placeholder="Адрес или Google Maps ссылка"
                      className={`col-span-3 ${orderFormData.latitude && orderFormData.longitude ? 'pr-10 border-green-500 focus:border-green-500' : ''} ${orderFormData.selectedClientId ? 'border-green-200 bg-green-50' : ''}`}
                      required
                    />
                    {orderFormData.latitude && orderFormData.longitude && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Можно вставить Google Maps ссылку</p>
                    {orderFormData.latitude && orderFormData.longitude && (
                      <p className="text-xs text-green-600 font-medium">
                        📍 {orderFormData.latitude.toFixed(4)}, {orderFormData.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="deliveryTime" className="text-right">
                  Время доставки
                </Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  value={orderFormData.deliveryTime}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, deliveryTime: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="quantity" className="text-right">
                  Количество
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={orderFormData.quantity}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="calories" className="text-right">
                  Калории
                  {orderFormData.selectedClientId && <span className="text-xs text-green-600 ml-1">✓</span>}
                </Label>
                <select
                  id="calories"
                  value={orderFormData.calories}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, calories: parseInt(e.target.value) }))}
                  className={`col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${orderFormData.selectedClientId ? 'border-green-200 bg-green-50' : ''}`}
                >
                  <option value="1200">1200 ккал</option>
                  <option value="1600">1600 ккал</option>
                  <option value="2000">2000 ккал</option>
                  <option value="2500">2500 ккал</option>
                  <option value="3000">3000 ккал</option>
                </select>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="paymentMethod" className="text-right">
                  Оплата
                </Label>
                <select
                  id="paymentMethod"
                  value={orderFormData.paymentMethod}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="CASH">Наличные</option>
                  <option value="CARD">Карта</option>
                </select>
              </div>

              {isCashLike && (
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label className="text-right">Amount</Label>
                  <div className="col-span-3">
                    <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <span
                        className={
                          (amountValue ?? 0) > 0
                            ? 'text-green-600 font-medium'
                            : (amountValue ?? 0) < 0
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        {formatCurrency(amountValue ?? 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(orderCost)}
                      </span>
                    </div>
                    {matchedClient ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Balance: {formatCurrency(clientBalance)}
                        {isDelivered ? ` | Received: ${formatCurrency(amountReceived)}` : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="specialFeatures" className="text-right">
                  Особенности
                  {orderFormData.selectedClientId && <span className="text-xs text-green-600 ml-1">✓</span>}
                </Label>
                <Input
                  id="specialFeatures"
                  value={orderFormData.specialFeatures}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, specialFeatures: e.target.value }))}
                  className={`col-span-3 ${orderFormData.selectedClientId ? 'border-green-200 bg-green-50' : ''}`}
                  placeholder="Особые пожелания"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="courier" className="text-right">
                  Курьер
                </Label>
                <select
                  id="courier"
                  value={orderFormData.courierId}
                  onChange={(e) => setOrderFormData((prev) => ({ ...prev, courierId: e.target.value }))}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Автоматически (если есть у клиента)</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-4">
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Map
                    </span>
                    {orderPoint ? (
                      <span className="text-xs text-muted-foreground">
                        {orderPoint.lat.toFixed(5)}, {orderPoint.lng.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Click map to pick a point
                      </span>
                    )}
                  </div>
                  <div className="p-3 border-b border-border">
                    <Input
                      value={orderFormData.deliveryAddress}
                      onChange={(e) => onAddressChange(e.target.value)}
                      placeholder="Google Maps link or coordinates (lat,lng)"
                    />
                  </div>
                  <div className="h-[190px] w-full">
                    <MiniLocationPickerMap
                      value={orderPoint}
                      onChange={(point) => {
                        // Persist coordinates into the address field so AdminDashboardPage can include them on submit.
                        onAddressChange(formatLatLng(point))
                      }}
                    />
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="col-span-4">
                  <Alert variant="destructive">
                    <AlertDescription>{orderError}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setOrderFormData((prev) => ({ ...prev, latitude: null, longitude: null }))
              setEditingOrderId(null)
            }}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isCreatingOrder} onClick={onSubmit as any}>
            {isCreatingOrder ? 'Сохранение...' : editingOrderId ? 'Сохранить изменения' : 'Создать заказ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
