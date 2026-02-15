'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Menu,
    X,
    Package,
    Users,
    BarChart3,
    History,
    User,
    Trash2,
    DollarSign,
    ChevronRight,
    Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface MobileSidebarProps {
    activeTab: string
    onTabChange: (tab: string) => void
    visibleTabs?: string[]
}

export function MobileSidebar({ activeTab, onTabChange, visibleTabs }: MobileSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { t } = useLanguage()

    // Close sidebar when clicking outside or pressing escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            // Prevent body scroll when sidebar is open
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const tabs = [
        { id: 'orders', icon: Package, label: t.admin.orders },
        { id: 'clients', icon: Users, label: t.admin.clients },
        { id: 'admins', icon: Users, label: t.admin.admins },
        { id: 'bin', icon: Trash2, label: t.admin.bin },
        { id: 'statistics', icon: BarChart3, label: t.admin.statistics },
        { id: 'history', icon: History, label: t.admin.history },
        { id: 'interface', icon: Settings, label: t.admin.interface },
        { id: 'profile', icon: User, label: t.common.profile },
        { id: 'warehouse', icon: Package, label: t.warehouse.title },
        { id: 'finance', icon: DollarSign, label: t.finance.title },
    ]

    const effectiveTabs =
        visibleTabs && visibleTabs.length > 0
            ? tabs.filter(tab => visibleTabs.includes(tab.id))
            : tabs

    const handleTabClick = (tabId: string) => {
        onTabChange(tabId)
        setIsOpen(false)
    }

    return (
        <>
            {/* Mobile Menu Toggle Button - Fixed position */}
            <Button
                variant="outline"
                size="icon"
                className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Button>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-background shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Sidebar Header */}
                        <div className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900 dark:text-white">AutoFood</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.dashboard}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="p-4 space-y-2">
                            {effectiveTabs.map((tab, index) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id

                                return (
                                    <motion.button
                                        key={tab.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleTabClick(tab.id)}
                                        className={`
                      w-full flex items-center justify-between p-3 rounded-xl
                      transition-all duration-200
                      ${isActive
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                                : 'hover:bg-muted text-foreground'
                                            }
                    `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{tab.label}</span>
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </nav>

                        {/* Bottom Section */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                © {new Date().getFullYear()} AutoFood
                            </p>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    )
}
