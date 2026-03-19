'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { enUS, ru, uz } from 'date-fns/locale'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  History, 
  User, 
  Shield, 
  Activity, 
  Search, 
  RefreshCw 
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { RefreshIconButton } from '@/components/admin/dashboard/shared/RefreshIconButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
import type { DateRange } from 'react-day-picker'
import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ActionLog {
  id: string
  action: string
  entityType: string
  description: string
  createdAt: string
  admin: {
    name: string
    email: string
    role: string
  }
}

interface HistoryTabProps {
  selectedDate?: Date | null
  applySelectedDate?: (date: Date | null) => void
  shiftSelectedDate?: (days: number) => void
  selectedDateLabel?: string
  selectedPeriod?: DateRange | undefined
  applySelectedPeriod?: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  profileUiText?: any
}

export function HistoryTab({ 
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedDateLabel,
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
  profileUiText
}: HistoryTabProps) {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS
  const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const fetchUsers = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/users-list');
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data.users || []);
      }
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (selectedUser !== 'all') params.append('adminId', selectedUser);
      if (selectedPeriod?.from) {
        const toYmd = (d: Date) => d.toISOString().split('T')[0];
        params.append('from', toYmd(selectedPeriod.from));
        params.append('to', toYmd(selectedPeriod.to ?? selectedPeriod.from));
      } else if (selectedDate) {
        params.append('date', selectedDate.toISOString());
      }
      const resp = await fetch(`/api/admin/action-logs?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } finally { setIsLoading(false); }
  }, [page, selectedPeriod, selectedUser, selectedDate]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(l => [l.action, l.entityType, l.description, l.admin.name].join(' ').toLowerCase().includes(q));
  }, [logs, searchTerm]);

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
        <div className={cn("text-3xl font-black tracking-tighter", color)}>{value}</div>
        <p className="text-sm font-bold opacity-40 mt-2">{sub}</p>
    </motion.div>
  );

  return (
    <TabsContent value="history" className="min-h-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="content-card flex-1 min-h-0 flex flex-col gap-8 md:gap-14 relative overflow-hidden px-4 md:px-14 py-8 md:py-16 transition-colors duration-300"
      >
        <div className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none">
            <Activity className="w-64 h-64 text-gourmet-ink dark:text-dark-text" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 text-gourmet-ink dark:text-dark-text">
            <div className="flex flex-col gap-2">
                <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">System Audit</motion.h2>
                <motion.p className="text-sm md:text-base opacity-40 font-bold uppercase tracking-[0.3em]">Operational Transparency Log</motion.p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 bg-white/40 dark:bg-dark-green/20 p-2 rounded-full shadow-xl">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-12 w-48 rounded-full border-none bg-transparent font-bold">
                        <User className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All Admins" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl backdrop-blur-xl">
                        <SelectItem value="all">All Admins</SelectItem>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <MetricCard label="Action Count" value={total} sub="Total operations recorded" color="text-gourmet-ink" dot="bg-blue-500" icon={History} />
            <MetricCard label="Active Admins" value={users.length} sub="Staff members tracked" color="text-gourmet-ink" dot="bg-emerald-500" icon={Shield} />
        </div>

        <div className="flex flex-col gap-8 relative z-10 flex-1 min-h-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Activity className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                    <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Event Stream</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <RefreshIconButton label="Refetch" onClick={fetchLogs} isLoading={isLoading} className="bg-white/40 border-none shadow-lg" />
                    {applySelectedPeriod && profileUiText && (
                        <CalendarDateSelector
                            selectedDate={selectedDate || null}
                            applySelectedDate={applySelectedDate!}
                            shiftSelectedDate={shiftSelectedDate!}
                            selectedDateLabel={selectedPeriodLabel}
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
                            placeholder="Filter events..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto no-scrollbar rounded-[40px] border-2 border-dashed border-gourmet-green/20 bg-white/40 p-4 md:p-8">
                <Table>
                    <TableHeader>
                        <TableRow className="border-none hover:bg-transparent uppercase tracking-widest text-[10px] opacity-40 font-black">
                            <TableHead>Execution Time</TableHead>
                            <TableHead>Initiator</TableHead>
                            <TableHead>Operation Status</TableHead>
                            <TableHead>Impact Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredLogs.map((log, idx) => (
                                <motion.tr 
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group border-b border-gourmet-green/10 last:border-none hover:bg-gourmet-green/5 transition-colors"
                                >
                                    <TableCell className="py-5 font-medium text-xs opacity-60">
                                        {format(new Date(log.createdAt), 'dd MMM HH:mm:ss', { locale: dateLocale })}
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{log.admin.name}</span>
                                            <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">{log.admin.role}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge variant="outline" className="rounded-full border-gourmet-ink/10 bg-white/40 px-3 uppercase text-[9px] font-black">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 max-w-sm truncate text-sm font-medium opacity-80" title={log.description}>
                                        {log.description}
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {filteredLogs.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center opacity-40 font-bold uppercase tracking-[0.2em] text-xs">No records found matching criteria.</TableCell>
                            </TableRow>
                        )}
                        {isLoading && logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between pt-6 border-t-2 border-dashed border-gourmet-green/10">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Showing {logs.length} of {total} events</div>
                <div className="flex gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => setPage(p => Math.max(0, p - 1))} 
                        disabled={page === 0 || isLoading}
                        className="rounded-full hover:bg-gourmet-green/10 font-bold"
                    >
                        <ChevronLeft className="mr-2 w-4 h-4" /> Previous
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setPage(p => p + 1)} 
                        disabled={!hasMore || isLoading}
                        className="rounded-full hover:bg-gourmet-green/10 font-bold"
                    >
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
      </motion.div>
    </TabsContent>
  )
}
