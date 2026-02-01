'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
    const { isInstallable, isInstalled, installApp } = usePWA()
    const [showPrompt, setShowPrompt] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [justInstalled, setJustInstalled] = useState(false)

    useEffect(() => {
        // Check if user has dismissed the prompt before
        const wasDismissed = localStorage.getItem('pwa-prompt-dismissed')
        if (wasDismissed) {
            setDismissed(true)
            return
        }

        // Show prompt after a delay if installable and not dismissed
        if (isInstallable && !dismissed) {
            const timer = setTimeout(() => {
                setShowPrompt(true)
            }, 5000) // Show after 5 seconds

            return () => clearTimeout(timer)
        }
    }, [isInstallable, dismissed])

    useEffect(() => {
        if (isInstalled && showPrompt) {
            setJustInstalled(true)
            const timer = setTimeout(() => {
                setShowPrompt(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isInstalled, showPrompt])

    const handleInstall = async () => {
        setInstalling(true)
        const success = await installApp()
        setInstalling(false)

        if (success) {
            setJustInstalled(true)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        setDismissed(true)
        localStorage.setItem('pwa-prompt-dismissed', 'true')
    }

    // Don't render if installed or not installable
    if (isInstalled && !justInstalled) return null
    if (!showPrompt) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-primary to-purple-600 p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">O'rnatish mavjud!</h3>
                                    <p className="text-xs text-white/80">AutoFood ilovasini o'rnating</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {justInstalled ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center space-x-3 text-green-600"
                            >
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Muvaffaqiyatli o'rnatildi!</p>
                                    <p className="text-xs text-slate-500">Endi ilovani ishlatishingiz mumkin</p>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                    Tezroq kirish va offline ishlash uchun ilovani o'rnating.
                                </p>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleInstall}
                                        disabled={installing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {installing ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        O'rnatish
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDismiss}
                                        className="px-4"
                                    >
                                        Keyin
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
