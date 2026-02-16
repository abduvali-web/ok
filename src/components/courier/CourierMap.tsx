'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet icon issue in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

interface Order {
    id: string
    orderNumber: number
    customer: {
        name: string
        phone: string
    }
    deliveryAddress: string
    latitude: number | null
    longitude: number | null
    deliveryTime: string
    quantity: number
    calories: number
    specialFeatures: string
    orderStatus: string
    deliveryDate?: string
    createdAt: string
    [key: string]: any
}

interface CourierMapProps {
    orders: Order[]
    currentLocation?: { lat: number; lng: number }
    onMarkerClick: (order: Order) => void
}

function MapViewport({ points }: { points: Array<[number, number]> }) {
    const map = useMap()
    useEffect(() => {
        if (!points || points.length === 0) return

        setTimeout(() => {
            map.invalidateSize()
            if (points.length === 1) {
                map.flyTo(points[0], 15, { duration: 0.5 })
                return
            }

            map.fitBounds(L.latLngBounds(points), {
                padding: [40, 40],
                maxZoom: 16,
            })
        }, 30)
    }, [map, points])
    return null
}

export default function CourierMap({ orders, currentLocation, onMarkerClick }: CourierMapProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const points = useMemo<Array<[number, number]>>(() => {
        const pts: Array<[number, number]> = []
        if (currentLocation) pts.push([currentLocation.lat, currentLocation.lng])
        for (const order of orders) {
            if (order.latitude != null && order.longitude != null) {
                pts.push([order.latitude, order.longitude])
            }
        }
        return pts
    }, [currentLocation, orders])

    // Initial center (viewport auto-fits to all points)
    const center: [number, number] = points.length > 0 ? points[0] : [41.2995, 69.2401] // Default to Tashkent

    if (!isMounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg" />

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {orders.map(order => (
                order.latitude != null && order.longitude != null && (
                    <Marker
                        key={order.id}
                        position={[order.latitude, order.longitude]}
                        icon={icon}
                        eventHandlers={{
                            click: () => onMarkerClick(order)
                        }}
                    >
                        <Popup>
                            <div className="cursor-pointer" onClick={() => onMarkerClick(order)}>
                                {order.deliveryAddress}
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}

            {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lng]} icon={icon}>
                    <Popup>
                        Ваше местоположение
                    </Popup>
                </Marker>
            )}

            <MapViewport points={points} />
        </MapContainer>
    )
}
