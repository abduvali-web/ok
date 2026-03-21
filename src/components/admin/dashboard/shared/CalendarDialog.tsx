'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    isWithinInterval,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

export interface CalendarDialogProps {
    isOpen: boolean
    onClose: () => void
    selectedDate?: Date | null
    selectedPeriod?: DateRange | undefined
    onApplyDate?: (date: Date) => void
    onApplyPeriod?: (range: DateRange) => void
    locale?: string
    uiText?: {
        reset?: string
        cancel?: string
        apply?: string
        days?: string[]
    }
}

const DEFAULT_UI_TEXT = {
    reset: 'Reset',
    cancel: 'Cancel',
    apply: 'Apply',
    days: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
}

const DAY_LABELS_BY_LOCALE: Record<string, string[]> = {
    'en-US': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    'ru-RU': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    'uz-UZ': ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
}

export function CalendarDialog({
    isOpen,
    onClose,
    selectedDate,
    selectedPeriod,
    onApplyDate,
    onApplyPeriod,
    locale = 'en-US',
    uiText: customUiText,
}: CalendarDialogProps) {
    const uiText = { ...DEFAULT_UI_TEXT, ...customUiText }
    const dayLabels = uiText.days || DAY_LABELS_BY_LOCALE[locale] || DAY_LABELS_BY_LOCALE['en-US']

    const [currentMonth, setCurrentMonth] = useState<Date>(() =>
        startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
    )
    const [draftStartDate, setDraftStartDate] = useState<Date>(() =>
        startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
    )
    const [draftEndDate, setDraftEndDate] = useState<Date | null>(() =>
        selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
    )

    // Reset draft dates when dialog opens
    useEffect(() => {
        if (isOpen) {
            const from = startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
            const to = selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
            setDraftStartDate(from)
            setDraftEndDate(to && !isSameDay(from, to) ? to : null)
            setCurrentMonth(from)
        }
    }, [isOpen, selectedDate, selectedPeriod?.from, selectedPeriod?.to])

    // Lock body scroll when dialog is open
    useEffect(() => {
        if (!isOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [isOpen])

    const handleDateClick = useCallback(
        (day: Date) => {
            const normalized = startOfDay(day)
            if (!draftStartDate || (draftStartDate && draftEndDate)) {
                setDraftStartDate(normalized)
                setDraftEndDate(null)
                return
            }

            if (draftStartDate && !draftEndDate) {
                if (isBefore(normalized, draftStartDate)) {
                    setDraftStartDate(normalized)
                    setDraftEndDate(null)
                    return
                }

                if (isSameDay(normalized, draftStartDate)) {
                    return
                }

                setDraftEndDate(normalized)
            }
        },
        [draftEndDate, draftStartDate]
    )

    const renderCalendar = useCallback(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDateView = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDateView = endOfWeek(monthEnd, { weekStartsOn: 1 })

        const rows: any[] = []
        let days: any[] = []
        let day = startDateView
        const dateFormat = 'd'

        while (day <= endDateView) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day
                const isSelected =
                    (draftStartDate && isSameDay(cloneDay, draftStartDate)) ||
                    (draftEndDate && isSameDay(cloneDay, draftEndDate))
                const isInRange =
                    draftStartDate && draftEndDate && isWithinInterval(cloneDay, { start: draftStartDate, end: draftEndDate })
                const isCurrentMonth = isSameMonth(cloneDay, monthStart)

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            'relative p-1 md:p-2 text-center cursor-pointer transition-all duration-150 rounded-lg md:rounded-xl',
                            !isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground',
                            isSelected
                                ? 'bg-primary text-primary-foreground shadow-md z-10'
                                : 'hover:bg-accent/10',
                            isInRange && !isSelected ? 'bg-primary/20' : ''
                        )}
                        onClick={() => handleDateClick(cloneDay)}
                    >
                        <span className="relative z-10 font-bold text-xs md:text-base">{format(cloneDay, dateFormat)}</span>
                    </div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className="flex flex-col gap-1">{rows}</div>
    }, [currentMonth, draftEndDate, draftStartDate, handleDateClick])

    const applyDraftRange = useCallback(() => {
        if (typeof onApplyPeriod === 'function') {
            onApplyPeriod({ from: draftStartDate, to: draftEndDate ?? draftStartDate })
            onClose()
            return
        }

        if (typeof onApplyDate === 'function') {
            onApplyDate(draftStartDate)
        }
        onClose()
    }, [onApplyDate, onApplyPeriod, onClose, draftEndDate, draftStartDate])

    const resetDraftRange = useCallback(() => {
        const today = startOfDay(new Date())
        setDraftStartDate(today)
        setDraftEndDate(null)
        setCurrentMonth(today)

        if (typeof onApplyPeriod === 'function') {
            onApplyPeriod({ from: today, to: today })
        } else if (typeof onApplyDate === 'function') {
            onApplyDate(today)
        }

        onClose()
    }, [onApplyDate, onApplyPeriod, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-card rounded-lg shadow-lg border border-border p-6 md:p-10 z-[1000] w-full max-w-[450px] mx-auto overflow-hidden transition-colors duration-150"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Calendar"
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent/10 transition-colors duration-150"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6 text-foreground" />
                        </button>

                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <button
                                type="button"
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-accent/10 rounded-full transition-colors duration-150"
                            >
                                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
                            </button>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-accent/10 rounded-full transition-colors duration-150"
                            >
                                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                            {dayLabels.map((d) => (
                                <div
                                    key={d}
                                    className="text-center text-[10px] md:text-sm font-bold text-foreground uppercase tracking-widest py-2"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="text-base md:text-lg">{renderCalendar()}</div>

                        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-dashed border-border">
                            <button
                                type="button"
                                onClick={resetDraftRange}
                                className="text-sm md:text-base font-medium text-foreground hover:text-foreground transition-colors duration-150"
                            >
                                {uiText.reset}
                            </button>
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 md:px-8 py-2 md:py-3 rounded-lg font-medium text-sm md:text-base text-foreground hover:bg-accent/10 transition-all duration-150 border border-border sm:border-none"
                                >
                                    {uiText.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={applyDraftRange}
                                    className="bg-primary text-primary-foreground px-8 md:px-10 py-2 md:py-3 rounded-lg font-medium text-sm md:text-base shadow-md hover:bg-primary/90 active:scale-95 transition-all duration-150"
                                >
                                    {uiText.apply}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
