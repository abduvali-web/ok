'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Calculator,
    ShoppingCart,
    ChefHat,
    Loader2,
    Users,
    UtensilsCrossed,
    RefreshCw,
    History,
    PieChart,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Box,
    ShoppingBag,
    Utensils,
    Cherry,
    CookingPot,
    ArrowRight,
    Clock,
    Info,
    X,
    Calendar as CalendarIcon,
} from 'lucide-react';
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
} from 'date-fns';
import { toast } from 'sonner';
import {
    getTomorrowsMenuNumber,
    getTomorrowsMenu,
    getMenuNumber,
    calculateIngredientsForMenu,
    calculateShoppingList,
    scaleIngredients,
    MEAL_TYPES,
    type DailyMenu,
    type Dish,
} from '@/lib/menuData';

import { IngredientsManager } from './warehouse/IngredientsManager';
import { CookingManager } from './warehouse/CookingManager';
import { RefreshIconButton } from '@/components/admin/dashboard/shared/RefreshIconButton'
import type { DateRange } from 'react-day-picker'
import { useLanguage } from '@/contexts/LanguageContext';
import { SetsTab } from './SetsTab';
import { TabEmptyState } from '@/components/admin/dashboard/shared/TabEmptyState';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WarehouseTabProps {
    className?: string;
}

export function WarehouseTab({ className, initialSubTab = 'cooking' }: WarehouseTabProps & { initialSubTab?: string }) {
    const { t, language } = useLanguage();
    const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

    useEffect(() => {
        setActiveSubTab(initialSubTab);
    }, [initialSubTab]);
    const [tomorrowMenu, setTomorrowMenu] = useState<DailyMenu | undefined>(undefined);
    const [tomorrowMenuNumber, setTomorrowMenuNumber] = useState<number>(0);
    const [dishQuantities, setDishQuantities] = useState<Record<number, number>>({});
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [clientsByCalorie, setClientsByCalorie] = useState<Record<number, number>>({
        1200: 0, 1600: 0, 2000: 0, 2500: 0, 3000: 0,
    });
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [activeSet, setActiveSet] = useState<any>(null);
    const [allClients, setAllClients] = useState<any[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [availableSets, setAvailableSets] = useState<any[]>([]);

    // Calculation state
    const [calculatedIngredients, setCalculatedIngredients] = useState<Map<string, { amount: number; unit: string }>>(new Map());
    const [shoppingList, setShoppingList] = useState<Map<string, { amount: number; unit: string }>>(new Map());
    const [calcRange, setCalcRange] = useState<DateRange | undefined>(undefined)

    // Cooking audit state
    const [cookingRange, setCookingRange] = useState<DateRange | undefined>(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return { from: tomorrow, to: tomorrow }
    })

    // Calendar dialog state
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [calendarMode, setCalendarMode] = useState<'cooking' | 'calc'>('cooking')
    const [currentMonth, setCurrentMonth] = useState<Date>(() =>
        startOfDay(cookingRange?.from ?? calcRange?.from ?? new Date())
    )
    const [draftStartDate, setDraftStartDate] = useState<Date>(() =>
        startOfDay(cookingRange?.from ?? calcRange?.from ?? new Date())
    )
    const [draftEndDate, setDraftEndDate] = useState<Date | null>(() =>
        (cookingRange?.to ?? calcRange?.to) ? startOfDay(cookingRange?.to ?? calcRange?.to ?? new Date()) : null
    )

    // Keep warehouse sub-tab in sync with sidebar "tree" shortcuts
    useEffect(() => {
        if (typeof window === 'undefined') return
        const valid = new Set(['cooking', 'sets', 'inventory', 'calculator'])
        try {
            const saved = localStorage.getItem('warehouseSubTab')
            if (saved && valid.has(saved)) setActiveSubTab(saved)
        } catch { /* ignore */ }

        const onSet = (event: Event) => {
            const detail = (event as CustomEvent<any>)?.detail
            const next = typeof detail?.subTab === 'string' ? detail.subTab : null
            if (next && valid.has(next)) setActiveSubTab(next)
        }
        window.addEventListener('warehouse:set-subtab', onSet as EventListener)
        return () => window.removeEventListener('warehouse:set-subtab', onSet as EventListener)
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem('warehouseSubTab', activeSubTab)
        } catch { /* ignore */ }
    }, [activeSubTab])

    // Lock body scroll when dialog is open
    useEffect(() => {
        if (!isDatePickerOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [isDatePickerOpen])
    const [selectedCookingDateISO, setSelectedCookingDateISO] = useState<string>(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return formatToIso(tomorrow)
    })
    const [cookingPlans, setCookingPlans] = useState<any[]>([])
    const [isCookingPlansLoading, setIsCookingPlansLoading] = useState(false)
    const [cookingPlansError, setCookingPlansError] = useState<string>('')
    const [cookingSelectedSetId, setCookingSelectedSetId] = useState<string>('active')

    function formatToIso(d: Date) {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    }

    const dateLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US';

    const auditUiText = useMemo(() => {
        if (language === 'ru') {
            return {
                setsTab: 'Сеты',
                activeSet: 'Активный (авто)',
                planned: 'Запланировано',
                cooked: 'Приготовлено',
                remaining: 'Осталось',
                failedLoadCookingPlans: 'Не удалось загрузить планы готовки',
                refresh: 'Обновить',
                statsHeader: 'Складская аналитика',
                statsSub: 'Управление запасами и производством',
                calendarUiText: {
                    calendar: 'Календарь',
                    today: 'Сегодня',
                    thisWeek: 'Неделя',
                    thisMonth: 'Месяц',
                    clearRange: 'Очистить',
                    allTime: 'За все время'
                }
            }
        }
        return {
            setsTab: 'Sets',
            activeSet: 'Active (auto)',
            planned: 'Planned',
            cooked: 'Cooked',
            remaining: 'Remaining',
            failedLoadCookingPlans: 'Failed to load cooking plans',
            refresh: 'Refresh',
            statsHeader: 'Warehouse Analytics',
            statsSub: 'Inventory & Production Management',
            calendarUiText: {
                calendar: 'Calendar',
                today: 'Today',
                thisWeek: 'This Week',
                thisMonth: 'This Month',
                clearRange: 'Clear',
                allTime: 'All Time'
            }
        }
    }, [language])

    const appliedRangeLabel = useMemo(() => {
        const range = calendarMode === 'cooking' ? cookingRange : calcRange
        const from = range?.from ?? null
        const to = range?.to ?? null
        if (!from) return 'All time'
        if (to && !isSameDay(from, to)) return `${format(from, 'd-MMM')} - ${format(to, 'd-MMM, yyyy')}`
        return format(from, 'd-MMM, yyyy')
    }, [cookingRange, calcRange, calendarMode])

    const openDatePicker = useCallback((mode: 'cooking' | 'calc') => {
        const range = mode === 'cooking' ? cookingRange : calcRange
        const from = startOfDay(range?.from ?? new Date())
        const to = range?.to ? startOfDay(range.to) : null
        setDraftStartDate(from)
        setDraftEndDate(to && !isSameDay(from, to) ? to : null)
        setCurrentMonth(from)
        setCalendarMode(mode)
        setIsDatePickerOpen(true)
    }, [cookingRange, calcRange])

    const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])

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
                    (draftStartDate && isSameDay(cloneDay, draftStartDate)) || (draftEndDate && isSameDay(cloneDay, draftEndDate))
                const isInRange =
                    draftStartDate && draftEndDate && isWithinInterval(cloneDay, { start: draftStartDate, end: draftEndDate })
                const isCurrentMonth = isSameMonth(cloneDay, monthStart)

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            'relative p-1 md:p-2 text-center cursor-pointer transition-all duration-200 rounded-lg md:rounded-xl',
                            !isCurrentMonth ? 'text-muted-foreground/40 dark:text-muted-foreground/40' : 'text-foreground dark:text-foreground',
                            isSelected
                                ? 'bg-primary text-foreground dark:text-foreground shadow-md z-10'
                                : 'hover:bg-muted dark:hover:bg-muted',
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
        const range = { from: draftStartDate, to: draftEndDate ?? draftStartDate }
        if (calendarMode === 'cooking') {
            setCookingRange(range)
        } else {
            setCalcRange(range)
        }
        closeDatePicker()
    }, [calendarMode, closeDatePicker, draftEndDate, draftStartDate])

    const resetDraftRange = useCallback(() => {
        const today = startOfDay(new Date())
        setDraftStartDate(today)
        setDraftEndDate(null)
        setCurrentMonth(today)

        const range = { from: today, to: today }
        if (calendarMode === 'cooking') {
            setCookingRange(range)
        } else {
            setCalcRange(range)
        }

        closeDatePicker()
    }, [calendarMode, closeDatePicker])

    const cookingRangeDays = useMemo(() => {
        if (!cookingRange?.from) return [] as string[]
        const end = cookingRange.to ?? cookingRange.from
        const dates: string[] = []
        const cursor = new Date(cookingRange.from)
        cursor.setHours(0, 0, 0, 0)
        while (cursor.getTime() <= end.getTime() && dates.length < 31) {
            dates.push(formatToIso(cursor))
            cursor.setDate(cursor.getDate() + 1)
        }
        return dates
    }, [cookingRange])

    const calcRangeDays = useMemo(() => {
        if (!calcRange?.from) return [] as string[]
        const end = calcRange.to ?? calcRange.from
        const dates: string[] = []
        const cursor = new Date(calcRange.from)
        cursor.setHours(0, 0, 0, 0)
        while (cursor.getTime() <= end.getTime() && dates.length < 45) {
            dates.push(formatToIso(cursor))
            cursor.setDate(cursor.getDate() + 1)
        }
        return dates
    }, [calcRange])

    const fetchData = useCallback(async () => {
        try {
            // Inventory
            const invResp = await fetch('/api/admin/warehouse/ingredients');
            if (invResp.ok) {
                const data = await invResp.json();
                if (Array.isArray(data)) {
                    const inv: Record<string, number> = {};
                    data.forEach(i => inv[i.name] = i.amount);
                    setInventory(inv);
                }
            }

            // Sets
            const setsResp = await fetch('/api/admin/sets');
            if (setsResp.ok) {
                const data = await setsResp.json();
                setAvailableSets(data || []);
                setActiveSet(data?.find((s: any) => s.isActive) || null);
            }

            // Clients & Orders
            const [cResp, oResp] = await Promise.all([
                fetch('/api/admin/clients'),
                fetch('/api/orders')
            ]);
            if (cResp.ok) setAllClients(await cResp.json());
            if (oResp.ok) {
                const data = await oResp.json();
                setAllOrders(data.orders || data || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const refreshCookingPlansForRange = useCallback(async () => {
        if (!cookingRange?.from) return;
        const from = formatToIso(cookingRange.from);
        const to = formatToIso(cookingRange.to ?? cookingRange.from);
        setIsCookingPlansLoading(true);
        try {
            const resp = await fetch(`/api/admin/warehouse/cooking-plan?from=${from}&to=${to}`);
            const data = await resp.json();
            setCookingPlans(data.plans || []);
        } catch (e) {
            setCookingPlansError('Error loading plans');
        } finally {
            setIsCookingPlansLoading(false);
        }
    }, [cookingRange]);

    useEffect(() => {
        fetchData();
        const m = getTomorrowsMenuNumber();
        setTomorrowMenuNumber(m);
        setTomorrowMenu(getTomorrowsMenu());
    }, [fetchData]);

    useEffect(() => {
        refreshCookingPlansForRange();
    }, [refreshCookingPlansForRange]);

    const cookingTotals = useMemo(() => {
        let p = 0, c = 0;
        cookingPlans.forEach(plan => {
            Object.values(plan.dishes || {}).forEach((q: any) => p += q);
            Object.values(plan.cookedStats || {}).forEach((ds: any) => {
                Object.values(ds || {}).forEach((q: any) => c += q);
            });
        });
        return { planned: p, cooked: c, remaining: Math.max(0, p - c) };
    }, [cookingPlans]);

    const selectedCookingMenuNumber = useMemo(() => {
        try {
            return getMenuNumber(new Date(selectedCookingDateISO));
        } catch { return tomorrowMenuNumber; }
    }, [selectedCookingDateISO, tomorrowMenuNumber]);

    const calculateForPeriod = (dates: string[]) => {
        const total = new Map<string, { amount: number; unit: string }>();
        dates.forEach(d => {
            const date = new Date(d);
            const menuNum = getMenuNumber(date);
            const dist = getDistributionForDate(date);
            const ings = calculateIngredientsForMenu(menuNum, dist, undefined, activeSet);
            ings.forEach((v, k) => {
                const ex = total.get(k);
                if (ex) ex.amount = Math.round((ex.amount + v.amount) * 10) / 10;
                else total.set(k, { ...v });
            });
        });
        setCalculatedIngredients(total);
        setShoppingList(calculateShoppingList(total, inventory));
        toast.success('Calculation complete');
    };

    function getDistributionForDate(date: Date) {
        const dist: any = { 1200: 0, 1600: 0, 2000: 0, 2500: 0, 3000: 0 };
        const ds = formatToIso(date);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const orders = allOrders.filter(o => String(o.deliveryDate || '').startsWith(ds));
        if (orders.length > 0) {
            orders.forEach(o => {
                const c = o.calories || 2000;
                if (c <= 1400) dist[1200]++;
                else if (c <= 1800) dist[1600]++;
                else if (c <= 2200) dist[2000]++;
                else if (c <= 2800) dist[2500]++;
                else dist[3000]++;
            });
        } else {
            allClients.forEach(c => {
                if (c.isActive === false) return;
                let dd = c.deliveryDays;
                if (typeof dd === 'string') try { dd = JSON.parse(dd) } catch { dd = {} }
                if (dd && dd[day] === false) return;
                const cal = c.calories || 2000;
                if (cal <= 1400) dist[1200]++;
                else if (cal <= 1800) dist[1600]++;
                else if (cal <= 2200) dist[2000]++;
                else if (cal <= 2800) dist[2500]++;
                else dist[3000]++;
            });
        }
        return dist;
    }

    const StatItem = ({ label, value, sub, color, dot, icon: Icon }: any) => (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl border-2 border-dashed border-border dark:border-border p-6 bg-white/40 dark:bg-muted/10 hover:bg-muted/10 transition-all duration-300 overflow-hidden"
        >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {Icon && <Icon className="w-10 h-10 text-foreground dark:text-foreground" />}
            </div>
            <div className="flex items-center gap-2 mb-3">
                <span className={cn("h-2 w-2 rounded-full", dot)} />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/60">{label}</span>
            </div>
            <div className={cn("text-3xl font-black tracking-tighter", color)}>{value}</div>
            <p className="text-xs font-bold text-muted-foreground/40 dark:text-muted-foreground/40 mt-1">{sub}</p>
        </motion.div>
    );

    return (
        <TabsContent value="warehouse" className="min-h-0">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card flex-1 min-h-0 flex flex-col gap-8 md:gap-14 relative overflow-hidden px-4 md:px-14 py-8 md:py-16 transition-colors duration-300"
            >
                {/* Background Watermark */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
                >
                    <Package className="w-64 h-64 text-foreground dark:text-foreground" />
                </motion.div>

                {/* Title Section (Moved above tabs) */}
                <div className="flex flex-col mb-4 md:mb-8 relative z-10 text-foreground dark:text-foreground px-4 md:px-0">
                    <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                        {auditUiText.statsHeader}
                    </motion.h2>
                    <motion.p className="text-sm md:text-base opacity-40 font-bold uppercase tracking-[0.3em] mt-2">
                        {auditUiText.statsSub}
                    </motion.p>
                </div>

                <div className="flex-1 min-h-0 relative z-10 flex flex-col md:flex-row pb-20 md:pb-0">
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="h-full w-full flex flex-col md:flex-row gap-6 md:gap-10 items-stretch">
                        
                        {/* Sidebar (PC) / Bottom Panel (Mobile) */}
                        <TabsList className="
                            fixed bottom-4 left-4 right-4 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto
                            !flex flex-row md:flex-col justify-around md:justify-start
                            bg-card/80 dark:bg-muted/40 backdrop-blur-2xl border-2 border-dashed border-border
                            !w-full md:!w-64 !h-20 md:!h-auto !p-2 md:!p-4 !rounded-[32px] md:!rounded-[40px] !gap-2
                            shadow-2xl md:shadow-xl shrink-0 overflow-x-auto md:overflow-visible no-scrollbar
                        ">
                            <TabsTrigger value="cooking" className="flex-1 md:flex-none justify-center md:justify-start h-[50px] rounded-full px-6 data-[state=active]:bg-primary dark:data-[state=active]:bg-primary font-black uppercase tracking-widest text-[10px] md:text-sm data-[state=active]:text-white transition-all duration-300 gap-2 md:gap-3 border-b-4 border-black/10 dark:border-black/20 bg-white/40 dark:bg-white/5 hover:bg-white/60">
                                <CookingPot className="w-5 h-5 hidden md:block" /> {t.warehouse.cooking}
                            </TabsTrigger>
                            <TabsTrigger value="sets" className="flex-1 md:flex-none justify-center md:justify-start h-[50px] rounded-full px-6 data-[state=active]:bg-primary dark:data-[state=active]:bg-primary font-black uppercase tracking-widest text-[10px] md:text-sm data-[state=active]:text-white transition-all duration-300 gap-2 md:gap-3 border-b-4 border-black/10 dark:border-black/20 bg-white/40 dark:bg-white/5 hover:bg-white/60">
                                <UtensilsCrossed className="w-5 h-5 hidden md:block" /> {auditUiText.setsTab}
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="flex-1 md:flex-none justify-center md:justify-start h-[50px] rounded-full px-6 data-[state=active]:bg-primary dark:data-[state=active]:bg-primary font-black uppercase tracking-widest text-[10px] md:text-sm data-[state=active]:text-white transition-all duration-300 gap-2 md:gap-3 border-b-4 border-black/10 dark:border-black/20 bg-white/40 dark:bg-white/5 hover:bg-white/60">
                                <Package className="w-5 h-5 hidden md:block" /> {t.warehouse.inventory}
                            </TabsTrigger>
                            <TabsTrigger value="calculator" className="flex-1 md:flex-none justify-center md:justify-start h-[50px] rounded-full px-6 data-[state=active]:bg-primary dark:data-[state=active]:bg-primary font-black uppercase tracking-widest text-[10px] md:text-sm data-[state=active]:text-white transition-all duration-300 gap-2 md:gap-3 border-b-4 border-black/10 dark:border-black/20 bg-white/40 dark:bg-white/5 hover:bg-white/60">
                                <Calculator className="w-5 h-5 hidden md:block" /> {t.warehouse.calculator}
                            </TabsTrigger>
                        </TabsList>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar px-2 md:px-0">

                        <TabsContent value="cooking" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatItem label={auditUiText.planned} value={cookingTotals.planned} sub="Portions total" color="text-foreground" dot="bg-foreground" icon={CookingPot} />
                                <StatItem label={auditUiText.cooked} value={cookingTotals.cooked} sub="Successfully prepared" color="text-emerald-600" dot="bg-emerald-500" icon={ChefHat} />
                                <StatItem label={auditUiText.remaining} value={cookingTotals.remaining} sub="Still to be done" color="text-amber-600" dot="bg-amber-500" icon={Clock} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 bg-card/60 dark:bg-muted/10 p-4 shrink-0 rounded-[32px] border-2 border-dashed border-border backdrop-blur-xl">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openDatePicker('cooking')}
                                    className="h-12 bg-white/50 dark:bg-muted/40 rounded-full border-2 border-dashed border-border/50 shadow-sm px-6 flex items-center gap-2 cursor-pointer transition-all hover:bg-muted/80 hover:border-border"
                                >
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-sm text-foreground">
                                        {appliedRangeLabel}
                                    </span>
                                </motion.button>
                                <Select value={cookingSelectedSetId} onValueChange={setCookingSelectedSetId}>
                                    <SelectTrigger className="h-12 w-[220px] rounded-full bg-white/50 dark:bg-muted/40 border-2 border-dashed border-border/50 shadow-sm font-bold px-6">
                                        <SelectValue placeholder={auditUiText.setsTab} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-3xl border-2 border-dashed border-border shadow-2xl backdrop-blur-xl p-2">
                                        <SelectItem value="active" className="rounded-xl font-bold">{auditUiText.activeSet}</SelectItem>
                                        {availableSets.map(s => <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <RefreshIconButton
                                    label={auditUiText.refresh}
                                    onClick={() => { fetchData(); refreshCookingPlansForRange(); }}
                                    isLoading={isCookingPlansLoading}
                                    className="h-12 rounded-full border-2 border-dashed border-primary/20 bg-primary/10 text-primary shadow-sm hover:shadow-md hover:bg-primary hover:text-white transition-all font-bold px-6 py-0 ml-auto"
                                />
                            </div>

                            <div className="rounded-[40px] border-2 border-dashed border-border bg-white/10 p-6">
                                <CookingManager
                                    date={selectedCookingDateISO}
                                    menuNumber={selectedCookingMenuNumber}
                                    clientsByCalorie={clientsByCalorie}
                                    clients={allClients}
                                    orders={allOrders}
                                    availableSets={availableSets}
                                    selectedSetId={cookingSelectedSetId}
                                    onSelectedSetIdChange={setCookingSelectedSetId}
                                    selectedCalorieGroup="all"
                                    onSelectedCalorieGroupChange={() => { }}
                                    showHeader={false}
                                    showContextInfo={false}
                                    onCook={() => { fetchData(); refreshCookingPlansForRange(); }}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="sets" className="h-full animate-in fade-in slide-in-from-bottom-4">
                            <SetsTab />
                        </TabsContent>

                        <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-[40px] p-8 flex items-center gap-6">
                                <div className="p-4 bg-amber-500/20 rounded-3xl text-amber-600">
                                    <Info className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-amber-700 uppercase tracking-tight">Stock Management</h3>
                                    <p className="text-amber-600/70 font-medium">{t.warehouse.inventoryInfo}</p>
                                </div>
                            </div>
                            <IngredientsManager onUpdate={fetchData} />
                        </TabsContent>

                        <TabsContent value="calculator" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-6 flex flex-col justify-center">
                                    <div className="bg-primary/10 border-2 border-dashed border-border rounded-[40px] p-8 flex items-center gap-6">
                                        <div className="p-4 bg-primary/20 rounded-3xl text-primary">
                                            <Calculator className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground/80 dark:text-foreground/80 uppercase tracking-tight">Provisioning</h3>
                                            <p className="text-foreground/40 dark:text-foreground/40 font-medium">Forecast ingredients based on expected menu cycle.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 p-4 bg-white/30 rounded-[40px] border border-border shadow-xl">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openDatePicker('calc')}
                                            className="h-16 w-full bg-white/50 dark:bg-muted/40 rounded-full border-2 border-dashed border-border shadow-sm px-6 flex items-center justify-center gap-3 cursor-pointer transition-colors hover:bg-muted"
                                        >
                                            <CalendarIcon className="w-6 h-6 text-primary" />
                                            <span className="font-black text-lg text-foreground">
                                                {appliedRangeLabel}
                                            </span>
                                        </motion.button>
                                        <Button
                                            onClick={() => calculateForPeriod(calcRangeDays)}
                                            size="lg"
                                            className="h-16 rounded-full bg-primary hover:bg-primary/90 text-white text-xl font-black uppercase tracking-widest shadow-xl border-2 border-dashed border-primary-foreground/20 hover:scale-[1.02] transition-all"
                                        >
                                            Run Calculation
                                            <ArrowRight className="ml-4 w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {calculatedIngredients.size > 0 ? (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                        >
                                            <div className="bg-white/40 dark:bg-muted/10 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-border p-8 flex flex-col gap-6">
                                                <h4 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/60">
                                                    <CookingPot className="w-6 h-6" />
                                                    Groceries
                                                </h4>
                                                <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-3">
                                                    {Array.from(calculatedIngredients.entries()).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between items-center bg-white/40 p-3 rounded-2xl border border-border">
                                                            <span className="font-bold text-foreground/70 dark:text-foreground/70">{k}</span>
                                                            <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary font-black">{v.amount} {v.unit}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-orange-500/5 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-orange-500/20 p-8 flex flex-col gap-6">
                                                <h4 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-orange-600/60">
                                                    <ShoppingBag className="w-6 h-6" />
                                                    To Buy
                                                </h4>
                                                <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-3">
                                                    {shoppingList.size > 0 ? Array.from(shoppingList.entries()).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between items-center bg-orange-500/10 p-3 rounded-2xl border border-orange-500/10">
                                                            <span className="font-bold text-orange-700">{k}</span>
                                                            <Badge variant="secondary" className="rounded-lg bg-orange-500 text-white font-black">{v.amount} {v.unit}</Badge>
                                                        </div>
                                                    )) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
                                                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600">
                                                                <Utensils className="w-8 h-8" />
                                                            </div>
                                                            <p className="font-bold text-emerald-600 uppercase tracking-widest text-xs">Pantry is full!</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[60px] border-4 border-dashed border-border p-20 text-center"
                                        >
                                            <div className="p-10 bg-primary/5 rounded-full mb-8 relative">
                                                <PieChart className="w-20 h-20 text-primary opacity-20" />
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 border-4 border-primary/20 rounded-full"
                                                />
                                            </div>
                                            <h4 className="text-2xl font-black text-muted-foreground/60 uppercase tracking-tighter mb-2">Ready for planning?</h4>
                                            <p className="text-muted-foreground/30 font-bold max-w-sm">Select a date range to calculate needed ingredients and shopping list.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </motion.div>

            {/* Calendar Dialog */}
            <AnimatePresence>
                {isDatePickerOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDatePicker}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card dark:bg-card rounded-3xl md:rounded-[40px] shadow-2xl border-2 border-border p-6 md:p-10 z-[1000] w-full max-w-[450px] mx-auto overflow-hidden transition-colors duration-300"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Calendar"
                        >
                            <button
                                type="button"
                                onClick={closeDatePicker}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted dark:hover:bg-muted transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-6 h-6 text-foreground dark:text-foreground" />
                            </button>

                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                                </button>
                                <h3 className="text-xl md:text-2xl font-black text-foreground dark:text-foreground">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                                {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => (
                                    <div
                                        key={d}
                                        className="text-center text-[10px] md:text-sm font-black text-foreground dark:text-foreground uppercase tracking-widest py-2"
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
                                    className="text-sm md:text-base font-bold text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                >
                                    Reset
                                </button>
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={closeDatePicker}
                                        className="px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm md:text-base text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-all border border-border sm:border-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyDraftRange}
                                        className="bg-primary dark:bg-primary text-foreground dark:text-foreground px-8 md:px-10 py-2 md:py-3 rounded-full font-bold text-sm md:text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all transition-colors duration-300"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </TabsContent>
    );
}
