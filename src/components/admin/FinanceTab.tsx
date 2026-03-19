'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    History,
    Plus,
    Loader2,
    Search,
    RotateCcw,
    Cherry,
    Utensils,
    CookingPot,
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownLeft,
} from 'lucide-react';
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
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector';
import type { DateRange } from 'react-day-picker'
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
    balance: number;
}

interface Transaction {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    category: string;
    createdAt: string;
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
    const [companyBalance, setCompanyBalance] = useState(0);
    const [clients, setClients] = useState<Client[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [isFinanceRefreshing, setIsFinanceRefreshing] = useState(false);
    const [isCompanyFundsModalOpen, setIsCompanyFundsModalOpen] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency', currency: 'UZS', minimumFractionDigits: 0,
        }).format(amount);
    };

    const fetchCompanyFinance = useCallback(async () => {
        try {
            let url = `/api/admin/finance/company?limit=100&type=all&category=all`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setCompanyBalance(data.companyBalance);
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchClients = useCallback(async () => {
        try {
            const r = await fetch(`/api/admin/finance/clients?filter=all`);
            if (r.ok) setClients(await r.json());
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchCompanyFinance();
        fetchClients();
    }, [fetchCompanyFinance, fetchClients]);

    const handleRefresh = async () => {
        setIsFinanceRefreshing(true);
        await Promise.all([fetchCompanyFinance(), fetchClients()]);
        setIsFinanceRefreshing(false);
    };

    const incomeSum = useMemo(() => clients.reduce((s, c) => c.balance > 0 ? s + c.balance : s, 0), [clients]);
    const debtSum = useMemo(() => Math.abs(clients.reduce((s, c) => c.balance < 0 ? s + c.balance : s, 0)), [clients]);

    const visibleHistoryRows = useMemo(() => {
        let rows = history;
        if (selectedPeriod?.from) {
            const start = new Date(selectedPeriod.from).setHours(0,0,0,0);
            const end = new Date(selectedPeriod.to ?? selectedPeriod.from).setHours(23,59,59,999);
            rows = rows.filter(tx => {
                const d = new Date(tx.createdAt).getTime();
                return d >= start && d <= end;
            });
        }
        const q = historySearchQuery.trim().toLowerCase();
        if (q) {
            rows = rows.filter(tx => (
                tx.description?.toLowerCase().includes(q) || 
                tx.category?.toLowerCase().includes(q) ||
                tx.customer?.name?.toLowerCase().includes(q)
            ));
        }
        return rows;
    }, [history, selectedPeriod, historySearchQuery]);

    const appliedRangeLabel = selectedPeriodLabel || 'All time'

    const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text'
    const cellBorder = 'border-l-2 border-dashed border-gourmet-green/25 dark:border-white/10'

    return (
        <TabsContent value="finance" className="min-h-0">
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
                        Financial Audit
                    </motion.h2>
                    <motion.p
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
                    >
                        Cashflow & Balance Statement
                    </motion.p>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="relative flex-1 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
                    >
                        <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
                            <Search className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text mr-3 md:mr-4" />
                            <input
                                type="text"
                                value={historySearchQuery}
                                onChange={(event) => setHistorySearchQuery(event.target.value)}
                                placeholder="Search transactions..."
                                className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-gourmet-ink dark:text-dark-text placeholder:text-gourmet-ink dark:placeholder:text-dark-text"
                            />
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
                        <div className="relative flex-shrink-0">
                            {applySelectedPeriod && profileUiText && (
                                <CalendarDateSelector
                                    selectedDate={selectedDate || null}
                                    applySelectedDate={applySelectedDate!}
                                    shiftSelectedDate={shiftSelectedDate!}
                                    selectedDateLabel={selectedPeriodLabel ?? selectedDateLabel}
                                    selectedPeriod={selectedPeriod}
                                    applySelectedPeriod={applySelectedPeriod}
                                    locale={calendarLocale}
                                    profileUiText={profileUiText}
                                    customTrigger={(open) => (
                                        <motion.div
                                            whileHover={{
                                                x: [0, -5],
                                                transition: { x: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
                                            }}
                                            whileTap={{ x: 0 }}
                                            onClick={open}
                                            className="w-[50px] h-[50px] md:w-auto md:h-[50px] flex items-center gap-4 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 group cursor-pointer transition-colors duration-300"
                                        >
                                            <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
                                                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text md:mr-3" />
                                                <span className="hidden md:inline font-bold text-sm md:text-lg text-gourmet-ink dark:text-dark-text whitespace-nowrap">
                                                    {appliedRangeLabel}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                />
                            )}
                        </div>

                        <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.15, y: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsCompanyFundsModalOpen(true)}
                                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                                aria-label="Manage Funds"
                                title="Manage Funds"
                            >
                                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                                </div>
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                                whileTap={{ scale: 0.8 }}
                                onClick={handleRefresh}
                                disabled={isFinanceRefreshing}
                                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                                aria-label="Refresh"
                                title="Refresh"
                            >
                                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <RotateCcw className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isFinanceRefreshing && 'animate-spin')} />
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-6 md:p-8 bg-gourmet-cream/40 dark:bg-dark-green/10 hover:bg-gourmet-green/10 dark:hover:bg-dark-green/20 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-gourmet-ink dark:bg-dark-text" />
                            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">Current Balance</span>
                        </div>
                        <div className="text-3xl md:text-5xl font-black tracking-tighter text-gourmet-ink dark:text-dark-text">{formatCurrency(companyBalance)}</div>
                        <p className="text-sm md:text-lg font-bold text-gourmet-ink/40 dark:text-dark-text/40 mt-2">System cash on hand</p>
                        <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-gourmet-ink dark:bg-dark-text" />
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-6 md:p-8 bg-gourmet-cream/40 dark:bg-dark-green/10 hover:bg-gourmet-green/10 dark:hover:bg-dark-green/20 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-emerald-500" />
                            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">Floating Prepaid</span>
                        </div>
                        <div className="text-3xl md:text-5xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeSum)}</div>
                        <p className="text-sm md:text-lg font-bold text-gourmet-ink/40 dark:text-dark-text/40 mt-2">Customer prepayments</p>
                        <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-emerald-500" />
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-6 md:p-8 bg-gourmet-cream/40 dark:bg-dark-green/10 hover:bg-gourmet-green/10 dark:hover:bg-dark-green/20 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingDown className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-rose-500" />
                            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">Accounts Receivable</span>
                        </div>
                        <div className="text-3xl md:text-5xl font-black tracking-tighter text-rose-600 dark:text-rose-400">{formatCurrency(debtSum)}</div>
                        <p className="text-sm md:text-lg font-bold text-gourmet-ink/40 dark:text-dark-text/40 mt-2">Pending customer debts</p>
                        <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-rose-500" />
                    </motion.div>
                </div>

                {/* Table Sheet */}
                <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
                    <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden relative flex-1 flex flex-col min-h-0">
                        <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-gourmet-green-light dark:text-gourmet-green">
                            <Cherry className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
                            <CookingPot className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
                        </div>

                        <div className="overflow-auto relative flex-1 min-h-0">
                            <Table className="min-w-[900px] text-gourmet-ink dark:text-dark-text">
                                <TableHeader>
                                    <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20 cursor-default">
                                        <TableHead className={cn('w-[200px]', headCell, 'pl-4 md:pl-6')}>Execution Date</TableHead>
                                        <TableHead className={cn(headCell, cellBorder)}>Entity/Reason</TableHead>
                                        <TableHead className={cn('w-[160px]', headCell, cellBorder)}>Classification</TableHead>
                                        <TableHead className={cn('w-[180px] text-right', headCell, cellBorder)}>Magnitude</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {visibleHistoryRows.map((tx, idx) => (
                                            <motion.tr 
                                                key={tx.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    'h-12 transition-colors border-t border-gourmet-green/15 dark:border-white/10',
                                                    idx % 2 === 0
                                                        ? 'bg-gourmet-cream dark:bg-dark-surface'
                                                        : 'bg-gourmet-cream/40 dark:bg-dark-green/20',
                                                    'hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30'
                                                )}
                                            >
                                                <TableCell className="pl-4 md:pl-6 font-medium text-xs text-gourmet-ink/60 dark:text-dark-text/60">
                                                    {new Date(tx.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                                                </TableCell>
                                                <TableCell className={cn(cellBorder)}>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight">{tx.description || tx.customer?.name || 'Company Operation'}</span>
                                                        <span className="text-[10px] text-gourmet-ink/40 dark:text-dark-text/40 uppercase font-black tracking-widest">
                                                            {tx.customer ? 'Customer Ledger' : 'Internal Funds'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn(cellBorder)}>
                                                    <Badge variant="outline" className="rounded-full border-gourmet-ink/10 dark:border-white/10 bg-gourmet-cream/40 dark:bg-dark-green/20 px-3 uppercase text-[9px] font-black">
                                                        {tx.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-black text-base tabular-nums tracking-tighter", cellBorder,
                                                    tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                )}>
                                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {visibleHistoryRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-20 text-center">
                                                <div className="inline-flex items-center gap-2 text-sm font-bold text-gourmet-ink/60 dark:text-dark-text/60">
                                                    <History className="size-4" />
                                                    No monetary movements found.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Fund Management Modal */}
            <Dialog open={isCompanyFundsModalOpen} onOpenChange={setIsCompanyFundsModalOpen}>
                <DialogContent className="rounded-[40px] border-none shadow-2xl backdrop-blur-3xl bg-white/90 dark:bg-dark-surface/90 p-10 max-w-lg">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-gourmet-ink dark:text-dark-text">Adjust Liquidity</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-dark-text/60 font-medium">Record a company cashflow event manually.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant={transactionType === 'INCOME' ? 'default' : 'outline'}
                                onClick={() => setTransactionType('INCOME')}
                                className={cn("h-16 rounded-[28px] text-lg font-black uppercase flex-col gap-1", 
                                    transactionType === 'INCOME' ? "bg-emerald-600 hover:bg-emerald-700" : "opacity-40"
                                )}
                            >
                                <ArrowUpRight className="w-5 h-5 mb-1" />
                                Add Funds
                            </Button>
                            <Button 
                                variant={transactionType === 'EXPENSE' ? 'default' : 'outline'}
                                onClick={() => setTransactionType('EXPENSE')}
                                className={cn("h-16 rounded-[28px] text-lg font-black uppercase flex-col gap-1", 
                                    transactionType === 'EXPENSE' ? "bg-rose-600 hover:bg-rose-700" : "opacity-40"
                                )}
                            >
                                <ArrowDownLeft className="w-5 h-5 mb-1" />
                                Withdrawal
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">Amount (UZS)</Label>
                            <Input 
                                type="number" 
                                value={transactionAmount} 
                                onChange={e => setTransactionAmount(e.target.value)}
                                className="h-16 rounded-[28px] bg-white dark:bg-dark-green/20 border-2 border-dashed border-slate-200 dark:border-white/10 text-2xl font-black px-8 focus:border-gourmet-green"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">Reason / Memo</Label>
                            <Input 
                                value={transactionDescription} 
                                onChange={e => setTransactionDescription(e.target.value)}
                                className="h-14 rounded-[24px] bg-white dark:bg-dark-green/20 border-none shadow-inner px-6 font-medium"
                                placeholder="E.g. Office rent, Investment..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-10 sm:justify-start gap-4">
                        <Button 
                            className="flex-1 h-14 rounded-[28px] bg-gourmet-green dark:bg-dark-green text-white font-black uppercase tracking-widest shadow-xl"
                            onClick={async () => {
                                if (!transactionAmount) return;
                                setIsSubmitting(true);
                                try {
                                    const resp = await fetch('/api/admin/finance/transaction', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            amount: parseFloat(transactionAmount),
                                            type: transactionType,
                                            description: transactionDescription,
                                            category: 'COMPANY_FUNDS'
                                        })
                                    });
                                    if (resp.ok) {
                                        toast.success('Funds recorded');
                                        setIsCompanyFundsModalOpen(false);
                                        fetchCompanyFinance();
                                    }
                                } finally { setIsSubmitting(false); }
                            }}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply To Balance'}
                        </Button>
                        <Button variant="ghost" className="h-14 rounded-[28px] font-bold" onClick={() => setIsCompanyFundsModalOpen(false)}>Dismiss</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TabsContent>
    );
}
