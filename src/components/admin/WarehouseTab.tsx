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
} from 'lucide-react';
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
import { CalendarRangeSelector } from '@/components/admin/dashboard/shared/CalendarRangeSelector'
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

export function WarehouseTab({ className }: WarehouseTabProps) {
    const { t, language } = useLanguage();
    const [activeSubTab, setActiveSubTab] = useState('cooking');
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
            className="group relative rounded-3xl border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-6 bg-white/40 dark:bg-dark-green/10 hover:bg-gourmet-green/10 transition-all duration-300 overflow-hidden"
        >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {Icon && <Icon className="w-10 h-10 text-gourmet-ink dark:text-dark-text" />}
            </div>
            <div className="flex items-center gap-2 mb-3">
                <span className={cn("h-2 w-2 rounded-full", dot)} />
                <span className="text-xs font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">{label}</span>
            </div>
            <div className={cn("text-3xl font-black tracking-tighter", color)}>{value}</div>
            <p className="text-xs font-bold text-gourmet-ink/40 dark:text-dark-text/40 mt-1">{sub}</p>
        </motion.div>
    );

    return (
        <TabsContent value="warehouse" className="min-h-0">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="content-card flex-1 min-h-0 flex flex-col gap-8 md:gap-14 relative overflow-hidden px-4 md:px-14 py-8 md:py-16 transition-colors duration-300"
            >
                {/* Background Watermark */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
                >
                    <Package className="w-64 h-64 text-gourmet-ink dark:text-dark-text" />
                </motion.div>

                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 text-gourmet-ink dark:text-dark-text">
                    <div className="flex flex-col gap-2">
                        <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                            {auditUiText.statsHeader}
                        </motion.h2>
                        <motion.p className="text-sm md:text-base opacity-40 font-bold uppercase tracking-[0.3em]">
                            {auditUiText.statsSub}
                        </motion.p>
                    </div>

                    <TabsList className="bg-white/40 dark:bg-dark-green/20 backdrop-blur-xl border border-white/20 p-1 rounded-[32px] h-14 md:h-16 flex items-center md:px-6 shadow-xl">
                        <TabsTrigger value="cooking" className="rounded-full px-6 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500">
                            {t.warehouse.cooking}
                        </TabsTrigger>
                        <TabsTrigger value="sets" className="rounded-full px-6 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500">
                            {auditUiText.setsTab}
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="rounded-full px-6 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500">
                            {t.warehouse.inventory}
                        </TabsTrigger>
                        <TabsTrigger value="calculator" className="rounded-full px-6 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500">
                            {t.warehouse.calculator}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-auto no-scrollbar pb-10 relative z-10">
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="h-full flex flex-col">
                        
                        <TabsContent value="cooking" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatItem label={auditUiText.planned} value={cookingTotals.planned} sub="Portions total" color="text-gourmet-ink" dot="bg-gourmet-ink" icon={CookingPot} />
                                <StatItem label={auditUiText.cooked} value={cookingTotals.cooked} sub="Successfully prepared" color="text-emerald-600" dot="bg-emerald-500" icon={ChefHat} />
                                <StatItem label={auditUiText.remaining} value={cookingTotals.remaining} sub="Still to be done" color="text-amber-600" dot="bg-amber-500" icon={Clock} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 bg-white/20 dark:bg-dark-green/5 p-4 rounded-3xl border-2 border-dashed border-gourmet-green/20">
                                <CalendarRangeSelector 
                                    value={cookingRange} 
                                    onChange={setCookingRange} 
                                    locale={dateLocale}
                                    uiText={auditUiText.calendarUiText}
                                    className="bg-white/50 dark:bg-dark-green/20 rounded-2xl border-none shadow-inner"
                                />
                                <Select value={cookingSelectedSetId} onValueChange={setCookingSelectedSetId}>
                                    <SelectTrigger className="h-12 w-[220px] rounded-2xl bg-white/50 dark:bg-dark-green/20 border-none shadow-inner">
                                        <SelectValue placeholder={auditUiText.setsTab} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl backdrop-blur-xl">
                                        <SelectItem value="active">{auditUiText.activeSet}</SelectItem>
                                        {availableSets.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <RefreshIconButton 
                                    label={auditUiText.refresh} 
                                    onClick={() => { fetchData(); refreshCookingPlansForRange(); }} 
                                    isLoading={isCookingPlansLoading}
                                    className="bg-gourmet-green dark:bg-dark-green text-gourmet-cream shadow-lg hover:shadow-2xl transition-all"
                                />
                            </div>

                            <div className="rounded-[40px] border-2 border-dashed border-gourmet-green/20 bg-white/10 p-6">
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
                                    onSelectedCalorieGroupChange={() => {}}
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
                                    <div className="bg-gourmet-green/10 border-2 border-dashed border-gourmet-green/30 rounded-[40px] p-8 flex items-center gap-6">
                                        <div className="p-4 bg-gourmet-green/20 rounded-3xl text-gourmet-green">
                                            <Calculator className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gourmet-ink/80 dark:text-dark-text/80 uppercase tracking-tight">Provisioning</h3>
                                            <p className="text-gourmet-ink/40 dark:text-dark-text/40 font-medium">Forecast ingredients based on expected menu cycle.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 p-4 bg-white/30 rounded-[40px] border border-white/40 shadow-xl">
                                        <CalendarRangeSelector value={calcRange} onChange={setCalcRange} locale={dateLocale} uiText={auditUiText.calendarUiText} className="w-full bg-transparent border-none" />
                                        <Button 
                                            onClick={() => calculateForPeriod(calcRangeDays)} 
                                            className="h-16 rounded-[32px] bg-gourmet-green hover:bg-gourmet-green/90 dark:bg-dark-green text-xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
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
                                            <div className="bg-white/40 dark:bg-dark-green/10 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-gourmet-green/20 p-8 flex flex-col gap-6">
                                                <h4 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">
                                                    <CookingPot className="w-6 h-6" />
                                                    Groceries
                                                </h4>
                                                <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-3">
                                                    {Array.from(calculatedIngredients.entries()).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between items-center bg-white/40 p-3 rounded-2xl border border-white/20">
                                                            <span className="font-bold text-gourmet-ink/70 dark:text-dark-text/70">{k}</span>
                                                            <Badge variant="secondary" className="rounded-lg bg-gourmet-green/10 text-gourmet-green font-black">{v.amount} {v.unit}</Badge>
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
                                            className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[60px] border-4 border-dashed border-gourmet-green/10 p-20 text-center"
                                        >
                                            <div className="p-10 bg-gourmet-green/5 rounded-full mb-8 relative">
                                                <PieChart className="w-20 h-20 text-gourmet-green opacity-20" />
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 border-4 border-gourmet-green/20 rounded-full"
                                                />
                                            </div>
                                            <h4 className="text-2xl font-black text-gourmet-ink/60 uppercase tracking-tighter mb-2">Ready for planning?</h4>
                                            <p className="text-gourmet-ink/30 font-bold max-w-sm">Select a date range to calculate needed ingredients and shopping list.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </motion.div>
        </TabsContent>
    );
}
