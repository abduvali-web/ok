'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    History,
    Plus,
    Minus,
    Loader2,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { getAllIngredients } from '@/lib/menuData';
import { useLanguage } from '@/contexts/LanguageContext';

import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector';
import { RefreshIconButton } from '@/components/admin/dashboard/shared/RefreshIconButton'
import { SearchPanel } from '@/components/ui/search-panel'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface FinanceTabProps {
    className?: string;
    selectedDate?: Date | null;
    applySelectedDate?: (date: Date | null) => void;
    shiftSelectedDate?: (days: number) => void;
    selectedDateLabel?: string;
    selectedPeriod?: DateRange | undefined
    applySelectedPeriod?: (range: DateRange | undefined) => void
    selectedPeriodLabel?: string
    profileUiText?: any;
}

interface Client {
    id: string;
    name: string;
    phone: string;
    balance: number;
    dailyPrice?: number;
    planType?: string;
}

interface AdminSalaryBalanceRow {
    id: string
    name: string
    role: string
    isActive: boolean
    createdAt: string
    salaryPerDay: number
    days: number
    accrued: number
    paid: number
    balance: number
}

interface Transaction {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    category: string;
    createdAt: string;
    admin?: { name: string };
    customer?: { name: string; phone: string };
}

export function FinanceTab({
    className,
    selectedDate,
    applySelectedDate,
    shiftSelectedDate,
    selectedDateLabel,
    selectedPeriod,
    applySelectedPeriod,
    selectedPeriodLabel,
    profileUiText
}: FinanceTabProps) {
    const { t, language } = useLanguage();
    const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'
    const [activeSubTab, setActiveSubTab] = useState('history');
    const [companyBalance, setCompanyBalance] = useState(0);
    const [clients, setClients] = useState<Client[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [ingredientsList, setIngredientsList] = useState<string[]>([]);

    // Filters
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [categories, setCategories] = useState<string[]>([]);

    // Salary payout (as an expense category inside the general withdraw flow)
    const [salaryAdmins, setSalaryAdmins] = useState<AdminSalaryBalanceRow[]>([])
    const [isSalaryAdminsLoading, setIsSalaryAdminsLoading] = useState(false)
    const [selectedSalaryAdminId, setSelectedSalaryAdminId] = useState('')
    const [isFinanceRefreshing, setIsFinanceRefreshing] = useState(false)

    const visibleHistory = useMemo(() => {
        if (!selectedPeriod?.from) return history
        const start = new Date(selectedPeriod.from)
        start.setHours(0, 0, 0, 0)
        const end = new Date(selectedPeriod.to ?? selectedPeriod.from)
        end.setHours(23, 59, 59, 999)

        return history.filter((tx) => {
            const at = new Date(tx.createdAt).getTime()
            return at >= start.getTime() && at <= end.getTime()
        })
    }, [history, selectedPeriod])

    // Modals
    const [isCompanyFundsModalOpen, setIsCompanyFundsModalOpen] = useState(false);
    const [isBuyIngredientsModalOpen, setIsBuyIngredientsModalOpen] = useState(false);

    // Form Data
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionCategory, setTransactionCategory] = useState('');
    const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Buy Ingredients Form
    const [purchaseItems, setPurchaseItems] = useState<{ name: string; amount: string; costPerUnit: string }[]>([
        { name: '', amount: '', costPerUnit: '' }
    ]);

    useEffect(() => {
        setIngredientsList(getAllIngredients());
    }, []);

    useEffect(() => {
        fetchCompanyFinance();
        fetchClients();
    }, []);

    useEffect(() => {
        // Keep the client debt / prepaid widgets aligned with the selected audit period.
        const asOf = selectedPeriod?.to ?? selectedPeriod?.from ?? selectedDate ?? null
        void fetchClients(asOf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod?.from, selectedPeriod?.to, selectedDate]);

    useEffect(() => {
        fetchCompanyFinance(); // Refresh history
    }, [selectedDate]);

    useEffect(() => {
        if (!isCompanyFundsModalOpen) return
        if (!(transactionType === 'EXPENSE' && transactionCategory === 'SALARY')) return
        void fetchSalaryAdmins()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompanyFundsModalOpen, transactionCategory, transactionType, selectedDate, selectedPeriod]);

    const fetchCompanyFinance = async () => {
        try {
            let url = `/api/admin/finance/company?limit=50&type=all&category=all`;
            if (activeSubTab === 'history' && selectedDate) {
                // Only filter by date when viewing history, so total company balance isn't affected.
                url += `&date=${selectedDate.toISOString()}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setCompanyBalance(data.companyBalance);
                setHistory(data.history);

                // Extract unique categories
                const uniqueCategories = Array.from(new Set(data.history.map((tx: Transaction) => tx.category)));
                setCategories(uniqueCategories as string[]);
            }
        } catch (error) {
            console.error('Error fetching company finance:', error);
            toast.error('Ошибка загрузки данных финансов');
        }
    };

    const handleRefreshFinance = async () => {
        setIsFinanceRefreshing(true)
        try {
            await Promise.resolve(fetchCompanyFinance())
            const asOf = selectedPeriod?.to ?? selectedPeriod?.from ?? selectedDate ?? null
            await Promise.resolve(fetchClients(asOf))
        } finally {
            setIsFinanceRefreshing(false)
        }
    }

    const fetchClients = async (asOf: Date | null = null) => {
        try {
            let url = `/api/admin/finance/clients?filter=all`
            if (asOf) url += `&asOf=${encodeURIComponent(asOf.toISOString())}`
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Ошибка загрузки списка клиентов');
        }
    };

    const fetchSalaryAdmins = async () => {
        setIsSalaryAdminsLoading(true);
        try {
            const asOf = (selectedPeriod?.to ?? selectedPeriod?.from ?? selectedDate ?? new Date()).toISOString();
            const response = await fetch(`/api/admin/finance/admin-balances?asOf=${encodeURIComponent(asOf)}`);
            if (response.ok) {
                const data = await response.json();
                setSalaryAdmins(Array.isArray(data?.admins) ? data.admins : []);
            }
        } catch (error) {
            console.error('Error fetching salary admins:', error);
        } finally {
            setIsSalaryAdminsLoading(false);
        }
    };

    const handleTransactionSubmit = async () => {
        const isSalaryPayout = transactionType === 'EXPENSE' && transactionCategory === 'SALARY';
        if (isSalaryPayout) {
            if (!selectedSalaryAdminId) {
                toast.error(t.finance.selectStaff);
                return;
            }
            if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
                toast.error(t.finance.enterAmount);
                return;
            }

            setIsSubmitting(true);
            try {
                const response = await fetch('/api/admin/finance/salary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientAdminId: selectedSalaryAdminId,
                        amount: parseFloat(transactionAmount),
                    }),
                });

                if (response.ok) {
                    toast.success(t.finance.salaryPaid);
                    setIsCompanyFundsModalOpen(false);

                    setSelectedSalaryAdminId('');
                    setTransactionAmount('');
                    setTransactionDescription('');
                    setTransactionCategory('');
                    setTransactionType('INCOME');

                    fetchCompanyFinance();
                    fetchSalaryAdmins();
                } else {
                    const data = await response.json();
                    toast.error(data.error || t.finance.paymentError);
                }
            } catch (error) {
                console.error('Error paying salary:', error);
                toast.error(t.common.connectionError);
            } finally {
                setIsSubmitting(false);
            }

            return;
        }

        if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
            toast.error(t.finance.enterAmount);
            return;
        }
        if (!transactionDescription) {
            toast.error(t.finance.enterDescription);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                amount: parseFloat(transactionAmount),
                type: transactionType,
                description: transactionDescription,
                category: transactionCategory || 'COMPANY_FUNDS'
            };

            const response = await fetch('/api/admin/finance/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(t.finance.transactionSuccess);
                setIsCompanyFundsModalOpen(false);

                // Reset form
                setTransactionAmount('');
                setTransactionDescription('');
                setTransactionCategory('');
                setTransactionType('INCOME');

                // Refresh data
                fetchCompanyFinance();
                fetchClients();
            } else {
                toast.error(t.finance.transactionError);
            }
        } catch (error) {
            console.error('Error submitting transaction:', error);
            toast.error(t.common.connectionError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPurchaseItem = () => {
        setPurchaseItems([...purchaseItems, { name: '', amount: '', costPerUnit: '' }]);
    };

    const handleRemovePurchaseItem = (index: number) => {
        const newItems = [...purchaseItems];
        newItems.splice(index, 1);
        setPurchaseItems(newItems);
    };

    const handlePurchaseItemChange = (index: number, field: string, value: string) => {
        const newItems = [...purchaseItems];
        // @ts-ignore
        newItems[index][field] = value;
        setPurchaseItems(newItems);
    };

    const calculateTotalPurchaseCost = () => {
        return purchaseItems.reduce((total, item) => {
            const amount = parseFloat(item.amount) || 0;
            const cost = parseFloat(item.costPerUnit) || 0;
            return total + (amount * cost);
        }, 0);
    };

    const handleBuyIngredientsSubmit = async () => {
        // Validate
        const itemsToBuy = purchaseItems.filter(item => item.name && item.amount && item.costPerUnit);
        if (itemsToBuy.length === 0) {
            toast.error(t.warehouse.addIngredient);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: itemsToBuy.map(item => ({
                    name: item.name,
                    amount: parseFloat(item.amount),
                    costPerUnit: parseFloat(item.costPerUnit),
                    unit: 'kg' // Default assumption from UI
                }))
            };

            const response = await fetch('/api/admin/finance/buy-ingredients', {
                method: 'POST', // Correct method for buying ingredients
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(t.finance.buySuccess);
                setIsBuyIngredientsModalOpen(false);
                setPurchaseItems([{ name: '', amount: '', costPerUnit: '' }]);
                fetchCompanyFinance();
            } else {
                const data = await response.json();
                toast.error(data.error || t.finance.buyError);
            }
        } catch (error) {
            console.error('Error buying ingredients:', error);
            toast.error(t.common.connectionError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const visibleHistoryRows = useMemo(() => {
        const q = historySearchQuery.trim().toLowerCase()
        if (!q) return visibleHistory

        return visibleHistory.filter((tx) => {
            const hay = [
                tx.type,
                tx.category,
                tx.description,
                String(tx.amount ?? ''),
                tx.customer?.name,
                tx.customer?.phone,
                tx.customer ? 'client' : 'company',
                formatDate(tx.createdAt),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            return hay.includes(q)
        })
    }, [formatDate, historySearchQuery, visibleHistory])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="content-card flex-1 min-h-0 flex flex-col gap-6 md:gap-10 relative overflow-hidden px-4 md:px-14 py-6 md:py-10 transition-colors duration-300"
        >
            {/* Background Watermark */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
            >
                <Wallet className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
            </motion.div>

            {/* Title */}
            <div className="flex flex-col gap-2 relative z-10">
                <motion.h2
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
                >
                    {t.finance.title}
                </motion.h2>
                <motion.p
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
                >
                    {t.finance.description || 'Manage your finances'}
                </motion.p>
            </div>

            {/* Top Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/60 dark:bg-dark-surface/30 p-4 md:p-5 transition-all duration-300 hover:shadow-xl hover:border-gourmet-green/45 dark:hover:border-white/15"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-gourmet-ink dark:text-dark-text">{t.finance.companyBalance}</h3>
                        <div className="w-10 h-10 rounded-full bg-gourmet-green dark:bg-dark-green border-b-4 border-black/20 flex items-center justify-center shadow-lg">
                            <Wallet className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
                        </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-blue-600">{formatCurrency(companyBalance)}</div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs md:text-sm text-gourmet-ink/70 dark:text-dark-text/70">
                            {t.finance.currentFunds}
                        </p>
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.1, y: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setTransactionAmount('');
                                    setTransactionDescription('');
                                    setTransactionCategory('');
                                    setTransactionType('INCOME');
                                    setIsCompanyFundsModalOpen(true);
                                }}
                                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                                aria-label={t.finance.manageBalance}
                                title={t.finance.manageBalance}
                            >
                                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                                </div>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, y: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsBuyIngredientsModalOpen(true)}
                                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                                aria-label={t.finance.purchase}
                                title={t.finance.purchase}
                            >
                                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/60 dark:bg-dark-surface/30 p-4 md:p-5 transition-all duration-300 hover:shadow-xl hover:border-gourmet-green/45 dark:hover:border-white/15"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-gourmet-ink dark:text-dark-text">{t.finance.clientDebt}</h3>
                        <div className="w-10 h-10 rounded-full bg-gourmet-orange dark:bg-gourmet-orange border-b-4 border-black/20 flex items-center justify-center shadow-lg">
                            <TrendingDown className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
                        </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-rose-600">
                        {formatCurrency(clients.reduce((sum, c) => c.balance < 0 ? sum + c.balance : sum, 0))}
                    </div>
                    <p className="text-xs md:text-sm text-gourmet-ink/60 dark:text-dark-text/60 mt-1">
                        {t.finance.negativeBalanceSum}
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/60 dark:bg-dark-surface/30 p-4 md:p-5 transition-all duration-300 hover:shadow-xl hover:border-gourmet-green/45 dark:hover:border-white/15"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-gourmet-ink dark:text-dark-text">{t.finance.clientPrepaid}</h3>
                        <div className="w-10 h-10 rounded-full bg-gourmet-green dark:bg-dark-green border-b-4 border-black/20 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
                        </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-emerald-600">
                        {formatCurrency(clients.reduce((sum, c) => c.balance > 0 ? sum + c.balance : sum, 0))}
                    </div>
                    <p className="text-xs md:text-sm text-gourmet-ink/60 dark:text-dark-text/60 mt-1">
                        {t.finance.positiveBalanceSum}
                    </p>
                </motion.div>
            </div>

            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {t.finance.history}
                    </TabsTrigger>
                </TabsList>

                {/* HISTORY TAB */}
                <TabsContent value="history">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="content-card rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/60 dark:bg-dark-surface/30 backdrop-blur-xl p-4 md:p-6"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg md:text-xl font-bold text-gourmet-ink dark:text-dark-text">{t.finance.history}</h3>
                                <p className="text-sm text-gourmet-ink/70 dark:text-dark-text/70">{t.finance.historyDesc}</p>
                            </div>

                            {/* Controls Bar */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 md:gap-4 overflow-x-auto lg:overflow-visible py-2 no-scrollbar">
                                <RefreshIconButton
                                    label={profileUiText?.refresh ?? 'Refresh'}
                                    onClick={() => void handleRefreshFinance()}
                                    isLoading={isFinanceRefreshing}
                                    iconSize="md"
                                />

                                {applySelectedDate &&
                                    (applySelectedPeriod ? Boolean(selectedPeriodLabel) : Boolean(selectedDateLabel)) &&
                                    profileUiText ? (
                                    <CalendarDateSelector
                                        selectedDate={selectedDate || null}
                                        applySelectedDate={applySelectedDate}
                                        shiftSelectedDate={shiftSelectedDate}
                                        selectedDateLabel={selectedPeriodLabel ?? selectedDateLabel}
                                        selectedPeriod={selectedPeriod}
                                        applySelectedPeriod={applySelectedPeriod}
                                        locale={calendarLocale}
                                        profileUiText={profileUiText}
                                    />
                                ) : null}

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-sm flex-1 min-w-[200px]"
                                >
                                    <SearchPanel
                                        value={historySearchQuery}
                                        onChange={setHistorySearchQuery}
                                        placeholder={t.admin.searchPlaceholder}
                                        className="w-full"
                                    />
                                </motion.div>
                            </div>

                            {/* Table */}
                            <div className="overflow-auto relative flex-1 min-h-0 rounded-xl border-2 border-dashed border-gourmet-green/25 dark:border-white/10 bg-gourmet-cream/70 dark:bg-dark-green/10">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20 cursor-pointer select-none hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30">
                                            <TableHead className="text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.date}</TableHead>
                                            <TableHead className="text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.type}</TableHead>
                                            <TableHead className="text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.category}</TableHead>
                                            <TableHead className="text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.description}</TableHead>
                                            <TableHead className="text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.linkedTo}</TableHead>
                                            <TableHead className="text-right text-gourmet-ink dark:text-dark-text font-semibold">{t.finance.amount}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleHistoryRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-gourmet-ink/60 dark:text-dark-text/60">
                                                    {t.finance.emptyHistory}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            visibleHistoryRows.map((tx, index) => (
                                                <motion.tr
                                                    key={tx.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-b border-gourmet-green/10 dark:border-white/5 hover:bg-gourmet-green/5 dark:hover:bg-dark-green/10 transition-colors"
                                                >
                                                    <TableCell className="text-xs text-gourmet-ink/60 dark:text-dark-text/60">
                                                        {formatDate(tx.createdAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={tx.type === 'INCOME' ? 'outline' : 'secondary'} className={
                                                            tx.type === 'INCOME' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                                        }>
                                                            {tx.type === 'INCOME' ? t.finance.income : t.finance.expense}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-gourmet-ink dark:text-dark-text">
                                                        {tx.category}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-gourmet-ink dark:text-dark-text" title={tx.description}>
                                                        {tx.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gourmet-ink dark:text-dark-text">
                                                        {tx.customer ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{tx.customer.name}</span>
                                                                <span className="text-xs text-gourmet-ink/60 dark:text-dark-text/60">{t.admin.clients}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gourmet-ink/60 dark:text-dark-text/60">{t.finance.companyBalance}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* COMPANY FUNDS MODAL */}
            <Dialog open={isCompanyFundsModalOpen} onOpenChange={setIsCompanyFundsModalOpen}>
                <DialogContent className="content-card border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/90 dark:bg-dark-surface/90 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gourmet-ink dark:text-dark-text">{t.finance.manageBalance}</DialogTitle>
                        <DialogDescription className="text-gourmet-ink/70 dark:text-dark-text/70">
                            {t.finance.manageBalanceDesc}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-gourmet-ink dark:text-dark-text font-medium">{t.finance.type}</Label>
                            <div className="col-span-3 flex gap-2">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setTransactionType('INCOME')
                                        if (transactionCategory === 'SALARY') {
                                            setTransactionCategory('')
                                            setSelectedSalaryAdminId('')
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl border-2 border-dashed font-semibold transition-all duration-300",
                                        transactionType === 'INCOME'
                                            ? "bg-gourmet-green dark:bg-dark-green border-gourmet-green/50 text-gourmet-ink dark:text-dark-text shadow-lg"
                                            : "bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/20 text-gourmet-ink/60 dark:text-dark-text/60 hover:border-gourmet-green/40"
                                    )}
                                >
                                    <Plus className="w-4 h-4 mr-2 inline" />
                                    {t.finance.topUp}
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setTransactionType('EXPENSE')}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl border-2 border-dashed font-semibold transition-all duration-300",
                                        transactionType === 'EXPENSE'
                                            ? "bg-gourmet-orange dark:bg-gourmet-orange border-gourmet-orange/50 text-gourmet-ink dark:text-dark-text shadow-lg"
                                            : "bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-orange/20 text-gourmet-ink/60 dark:text-dark-text/60 hover:border-gourmet-orange/40"
                                    )}
                                >
                                    <Minus className="w-4 h-4 mr-2 inline" />
                                    {t.finance.withdraw}
                                </motion.button>
                            </div>
                        </div>


                        {/* Category + salary payout selection */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right text-gourmet-ink dark:text-dark-text font-medium">{t.finance.category}</Label>
                            <div className="col-span-3 relative">
                                <Input
                                    id="category"
                                    value={transactionCategory}
                                    onChange={(e) => {
                                        const next = e.target.value
                                        setTransactionCategory(next)
                                        if (next === 'SALARY') {
                                            setTransactionType('EXPENSE')
                                        }
                                    }}
                                    placeholder={t.finance.category}
                                    list="categories-datalist"
                                    className="bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                />
                                <datalist id="categories-datalist">
                                    <option value="COMPANY_FUNDS" />
                                    <option value="INVESTMENT" />
                                    <option value="WITHDRAWAL" />
                                    <option value="SALARY" />
                                    <option value="INGREDIENTS" />
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {transactionType === 'EXPENSE' && transactionCategory === 'SALARY' ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="salary-recipient" className="text-right text-gourmet-ink dark:text-dark-text font-medium">{t.finance.staff}</Label>
                                <Select
                                    value={selectedSalaryAdminId}
                                    onValueChange={(val) => {
                                        setSelectedSalaryAdminId(val)
                                        const row = salaryAdmins.find((a) => a.id === val)
                                        if (row) {
                                            const suggested = Math.max(0, Math.round(row.balance))
                                            if (!Number.isNaN(suggested)) {
                                                setTransactionAmount(String(suggested))
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger id="salary-recipient" className="col-span-3 bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10">
                                        <SelectValue placeholder={isSalaryAdminsLoading ? t.common.loading : t.finance.selectStaff} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salaryAdmins.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.name} ({a.role}) - {formatCurrency(a.balance)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right text-gourmet-ink dark:text-dark-text font-medium">
                                {t.finance.amount} ({transactionType === 'INCOME' ? '+' : '-'})
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                value={transactionAmount}
                                onChange={(e) => setTransactionAmount(e.target.value)}
                                className="col-span-3 bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                placeholder="0"
                            />
                        </div>

                        {!(transactionType === 'EXPENSE' && transactionCategory === 'SALARY') ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right text-gourmet-ink dark:text-dark-text font-medium">{t.finance.description}</Label>
                                <Input
                                    id="description"
                                    value={transactionDescription}
                                    onChange={(e) => setTransactionDescription(e.target.value)}
                                    className="col-span-3 bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                    placeholder={t.finance.description}
                                />
                            </div>
                        ) : null}

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompanyFundsModalOpen(false)} className="border-gourmet-green/25 dark:border-white/10">{t.common.cancel}</Button>
                        <Button onClick={handleTransactionSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Подтвердить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* BUY INGREDIENTS MODAL */}
            <Dialog open={isBuyIngredientsModalOpen} onOpenChange={setIsBuyIngredientsModalOpen}>
                <DialogContent className="content-card border-2 border-dashed border-gourmet-green/30 dark:border-white/10 bg-gourmet-cream/90 dark:bg-dark-surface/90 backdrop-blur-xl max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gourmet-ink dark:text-dark-text">{t.finance.buyIngredients}</DialogTitle>
                        <DialogDescription className="text-gourmet-ink/70 dark:text-dark-text/70">
                            {t.finance.buyIngredientsDesc}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex justify-between items-center px-1">
                            <Label className="w-1/3 text-gourmet-ink dark:text-dark-text font-medium">{t.warehouse.ingredient}</Label>
                            <Label className="w-24 text-gourmet-ink dark:text-dark-text font-medium">{t.finance.amountKg}</Label>
                            <Label className="w-24 text-gourmet-ink dark:text-dark-text font-medium">{t.finance.pricePerKg}</Label>
                            <Label className="w-24 text-gourmet-ink dark:text-dark-text font-medium">{t.finance.amount}</Label>
                            <div className="w-8"></div>
                        </div>

                        {purchaseItems.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex gap-2 items-center"
                            >
                                <div className="w-1/3 relative group">
                                    <div className="relative">
                                        <Input
                                            value={item.name}
                                            onChange={(e) => handlePurchaseItemChange(index, 'name', e.target.value)}
                                            placeholder={t.common.name}
                                            className="w-full bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                            list={`ingredients-list-${index}`}
                                        />
                                        <datalist id={`ingredients-list-${index}`}>
                                            {ingredientsList.map(ing => (
                                                <option key={ing} value={ing} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="0"
                                    className="w-24 bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                    value={item.amount}
                                    onChange={(e) => handlePurchaseItemChange(index, 'amount', e.target.value)}
                                />
                                <Input
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="0"
                                    className="w-24 bg-gourmet-cream/60 dark:bg-dark-surface/60 border-gourmet-green/25 dark:border-white/10"
                                    value={item.costPerUnit}
                                    onChange={(e) => handlePurchaseItemChange(index, 'costPerUnit', e.target.value)}
                                />
                                <div className="w-24 text-right font-medium text-sm text-gourmet-ink dark:text-dark-text">
                                    {formatCurrency((parseFloat(item.amount) || 0) * (parseFloat(item.costPerUnit) || 0))}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center"
                                    onClick={() => handleRemovePurchaseItem(index)}
                                    disabled={purchaseItems.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ))}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            variant="outline"
                            size="sm"
                            onClick={handleAddPurchaseItem}
                            className="w-full border-2 border-dashed border-gourmet-green/30 dark:border-white/10 py-3 rounded-xl text-gourmet-ink dark:text-dark-text font-medium hover:border-gourmet-green/50 dark:hover:border-white/20 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2 inline" /> {t.finance.addRow}
                        </motion.button>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gourmet-green/20 dark:border-white/10">
                        <div className="text-lg font-bold text-gourmet-ink dark:text-dark-text">
                            {t.finance.total}: {formatCurrency(calculateTotalPurchaseCost())}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsBuyIngredientsModalOpen(false)} className="border-gourmet-green/25 dark:border-white/10">{t.common.cancel}</Button>
                            <Button onClick={handleBuyIngredientsSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {t.finance.confirmPurchase}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div >
    );
}

// Ensure default export if needed, or stick to named export and import accordingly.
// Existing pages seem to use named imports for components.

