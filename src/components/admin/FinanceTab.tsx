'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    PieChart,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    ChevronDown,
    Search,
    Filter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const [activeSubTab, setActiveSubTab] = useState('history');
    const [companyBalance, setCompanyBalance] = useState(0);
    const [clients, setClients] = useState<Client[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [isFinanceRefreshing, setIsFinanceRefreshing] = useState(false);
    const [isCompanyFundsModalOpen, setIsCompanyFundsModalOpen] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionCategory, setTransactionCategory] = useState('');
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

    const MetricCard = ({ label, value, sub, icon: Icon, color, dot }: any) => (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-8 bg-white/40 dark:bg-dark-green/10 transition-all duration-300 overflow-hidden"
        >
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                {Icon && <Icon className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />}
            </div>
            <div className="flex items-center gap-3 mb-4">
                <span className={cn("h-3 w-3 rounded-full", dot)} />
                <span className="text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">{label}</span>
            </div>
            <div className={cn("text-3xl font-black tracking-tighter", color)}>{formatCurrency(value)}</div>
            <p className="text-sm font-bold opacity-40 mt-2">{sub}</p>
        </motion.div>
    );

    return (
        <TabsContent value="finance" className="min-h-0">
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
                    <Wallet className="w-64 h-64 text-gourmet-ink dark:text-dark-text" />
                </motion.div>

                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 text-gourmet-ink dark:text-dark-text">
                    <div className="flex flex-col gap-2">
                        <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                            Financial Audit
                        </motion.h2>
                        <motion.p className="text-sm md:text-base opacity-40 font-bold uppercase tracking-[0.3em]">
                            Cashflow & Balance Statement
                        </motion.p>
                    </div>

                    <div className="flex bg-white/40 dark:bg-dark-green/20 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-xl">
                        <Button 
                            onClick={() => setIsCompanyFundsModalOpen(true)}
                            className="rounded-full px-8 bg-gourmet-green dark:bg-dark-green text-gourmet-cream font-black uppercase tracking-widest text-xs h-12 md:h-14 hover:scale-[1.05] transition-all"
                        >
                            <Plus className="mr-3 w-5 h-5" />
                            Manage Funds
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <MetricCard label="Current Balance" value={companyBalance} sub="System cash on hand" color="text-gourmet-ink" dot="bg-gourmet-ink" icon={Wallet} />
                    <MetricCard label="Floating Prepaid" value={incomeSum} sub="Customer prepayments" color="text-emerald-600" dot="bg-emerald-500" icon={TrendingUp} />
                    <MetricCard label="Accounts Receivable" value={debtSum} sub="Pending customer debts" color="text-rose-600" dot="bg-rose-500" icon={TrendingDown} />
                </div>

                {/* Transactions Table Section */}
                <div className="flex flex-col gap-8 relative z-10 flex-1 min-h-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <History className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                            <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Transaction History</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <RefreshIconButton label="Refresh" onClick={handleRefresh} isLoading={isFinanceRefreshing} className="bg-white/40 border-none shadow-lg" />
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
                                        <Button onClick={open} variant="outline" className="h-10 rounded-2xl bg-white/40 border-none px-6 font-bold shadow-lg">
                                            {selectedPeriodLabel || 'All Time'}
                                        </Button>
                                    )}
                                />
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gourmet-ink/40" />
                                <Input 
                                    className="h-10 w-48 rounded-2xl border-none bg-white/40 shadow-lg pl-9 font-medium" 
                                    placeholder="Search..." 
                                    value={historySearchQuery}
                                    onChange={e => setHistorySearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto no-scrollbar rounded-[40px] border-2 border-dashed border-gourmet-green/20 bg-white/40 p-4 md:p-8">
                        <Table className="text-gourmet-ink dark:text-dark-text">
                            <TableHeader>
                                <TableRow className="border-none hover:bg-transparent uppercase tracking-widest text-[10px] opacity-40 font-black">
                                    <TableHead>Execution Date</TableHead>
                                    <TableHead>Entity/Reason</TableHead>
                                    <TableHead>Classification</TableHead>
                                    <TableHead className="text-right">Magnitude</TableHead>
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
                                            className="group border-b border-gourmet-green/10 last:border-none hover:bg-gourmet-green/5 transition-colors"
                                        >
                                            <TableCell className="py-5 font-medium text-xs opacity-60">
                                                {new Date(tx.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight">{tx.description || tx.customer?.name || 'Company Operation'}</span>
                                                    <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">
                                                        {tx.customer ? 'Customer Ledger' : 'Internal Funds'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <Badge variant="outline" className="rounded-full border-gourmet-ink/10 bg-white/40 px-3 uppercase text-[9px] font-black">
                                                    {tx.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn("py-5 text-right font-black text-base tabular-nums tracking-tighter",
                                                tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                                            )}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {visibleHistoryRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center opacity-40 font-bold uppercase tracking-[0.2em] text-xs">
                                            No monetary movements found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </motion.div>

            {/* Fund Management Modal */}
            <Dialog open={isCompanyFundsModalOpen} onOpenChange={setIsCompanyFundsModalOpen}>
                <DialogContent className="rounded-[40px] border-none shadow-2xl backdrop-blur-3xl bg-white/90 p-10 max-w-lg">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Adjust Liquidity</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Record a company cashflow event manually.</DialogDescription>
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
                                className="h-16 rounded-[28px] bg-white border-2 border-dashed border-slate-200 text-2xl font-black px-8 focus:border-gourmet-green"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">Reason / Memo</Label>
                            <Input 
                                value={transactionDescription} 
                                onChange={e => setTransactionDescription(e.target.value)}
                                className="h-14 rounded-[24px] bg-white border-none shadow-inner px-6 font-medium"
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
