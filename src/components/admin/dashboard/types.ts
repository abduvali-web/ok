export interface Admin {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  allowedTabs?: string[]
  salary?: number
  latitude?: number | null
  longitude?: number | null
}

export interface Order {
  id: string
  orderNumber: number
  customer: {
    name: string
    phone: string
    assignedSetId?: string | null
    assignedSetName?: string | null
  }
  deliveryAddress: string
  latitude?: number
  longitude?: number
  deliveryTime: string
  quantity: number
  calories: number
  specialFeatures: string
  paymentStatus: string
  paymentMethod: string
  orderStatus: string
  isPrepaid: boolean
  createdAt: string
  deliveryDate?: string
  isAutoOrder?: boolean
  customerName?: string
  customerPhone?: string
  courierId?: string
  courierName?: string
  assignedSetId?: string | null
  assignedSetName?: string | null
}

export interface Client {
  id: string
  name: string
  nickName?: string | null
  phone: string
  address: string
  calories: number
  planType: 'CLASSIC' | 'INDIVIDUAL' | 'DIABETIC'
  dailyPrice: number
  notes?: string
  specialFeatures: string
  deliveryDays: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  autoOrdersEnabled: boolean
  isActive: boolean
  createdAt: string
  deletedAt?: string
  deletedBy?: string
  defaultCourierId?: string
  defaultCourierName?: string
  assignedSetId?: string
  assignedSetName?: string
  googleMapsLink?: string
  latitude?: number | null
  longitude?: number | null
}

export interface Stats {
  successfulOrders: number
  failedOrders: number
  pendingOrders: number
  inDeliveryOrders: number
  pausedOrders: number
  prepaidOrders: number
  unpaidOrders: number
  cardOrders: number
  cashOrders: number
  dailyCustomers: number
  evenDayCustomers: number
  oddDayCustomers: number
  specialPreferenceCustomers: number
  orders1200: number
  orders1600: number
  orders2000: number
  orders2500: number
  orders3000: number
  singleItemOrders: number
  multiItemOrders: number
}
