'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
    useEffect(() => {
        // Only register service worker in production and when supported
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register after page load for better performance
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('ServiceWorker registered successfully:', registration.scope)

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update()
                        }, 60000) // Check every minute

                        // Handle updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content available, show refresh prompt if needed
                                        console.log('New content available, please refresh.')
                                    }
                                })
                            }
                        })
                    })
                    .catch((error) => {
                        console.error('ServiceWorker registration failed:', error)
                    })
            })
        }
    }, [])

    return null
}
