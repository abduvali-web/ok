'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { enUS, ru, uz } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'

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

interface User {
  id: string
  name: string
  role: string
}

interface HistoryTableProps {
  role?: string
  limit?: number
  compactMode?: boolean
}

type ActionFilter = 'all' | 'create' | 'update' | 'delete' | 'other'

function getActionKind(action: string): ActionFilter {
  if (action.includes('CREATE')) return 'create'
  if (action.includes('UPDATE')) return 'update'
  if (action.includes('DELETE')) return 'delete'
  return 'other'
}

export function HistoryTable({ role: _role, limit = 10, compactMode = false }: HistoryTableProps) {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState('all')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users-list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch {
      // ignore transient dashboard loading failures
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })

      if (selectedUser !== 'all') {
        params.append('adminId', selectedUser)
      }

      const response = await fetch(`/api/admin/action-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setHasMore(data.hasMore || false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, selectedUser])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(0)
  }, [selectedUser])

  function getActionBadgeColor(action: string) {
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-800'
    if (action.includes('UPDATE')) return 'bg-sky-100 text-sky-800'
    if (action.includes('DELETE')) return 'bg-rose-100 text-rose-800'
    return 'bg-slate-100 text-slate-800'
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return t.admin.superAdmin
      case 'MIDDLE_ADMIN':
        return t.admin.middleAdmin
      case 'LOW_ADMIN':
        return t.admin.lowAdmin
      case 'COURIER':
        return t.courier.title
      default:
        return role
    }
  }

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return logs.filter((log) => {
      const actionMatch = actionFilter === 'all' || getActionKind(log.action) === actionFilter
      if (!actionMatch) return false

      if (!query) return true

      const haystack = [
        log.action,
        log.entityType,
        log.description,
        log.admin.name,
        log.admin.role,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [actionFilter, logs, searchTerm])

  const summary = useMemo(() => {
    return filteredLogs.reduce(
      (acc, log) => {
        const kind = getActionKind(log.action)
        if (kind === 'create') acc.create += 1
        else if (kind === 'update') acc.update += 1
        else if (kind === 'delete') acc.delete += 1
        else acc.other += 1
        return acc
      },
      { create: 0, update: 0, delete: 0, other: 0 }
    )
  }, [filteredLogs])

  const pageRangeLabel = useMemo(() => {
    if (total === 0 || logs.length === 0) return `0 / ${total}`
    const start = page * limit + 1
    const end = page * limit + logs.length
    return `${start}-${end} / ${total}`
  }, [limit, logs.length, page, total])

  return (
    <Card className="glass-card border-none">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t.admin.actionHistory}</CardTitle>
            <CardDescription>{t.admin.totalRecords}: {total}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchLogs()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_1fr]">
          {users.length > 0 ? (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder={t.admin.allUsers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.allUsers}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({getRoleLabel(user.role)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}

          <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as ActionFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Action filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">CREATE</SelectItem>
              <SelectItem value="update">UPDATE</SelectItem>
              <SelectItem value="delete">DELETE</SelectItem>
              <SelectItem value="other">OTHER</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.admin.searchPlaceholder || 'Search logs'}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Visible</p>
            <p className="mt-1 text-xl font-semibold">{filteredLogs.length}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Create</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{summary.create}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Update</p>
            <p className="mt-1 text-xl font-semibold text-sky-600">{summary.update}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Delete</p>
            <p className="mt-1 text-xl font-semibold text-rose-600">{summary.delete}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Other</p>
            <p className="mt-1 text-xl font-semibold">{summary.other}</p>
          </div>
        </div>

        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.date}</TableHead>
                <TableHead>{t.common.user}</TableHead>
                <TableHead>{t.common.action}</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>{t.common.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {searchTerm || actionFilter !== 'all' ? 'No matches for current filters' : t.admin.emptyHistory}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className={compactMode ? 'h-8' : ''}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.admin.name}</span>
                        <span className="text-xs text-muted-foreground">{getRoleLabel(log.admin.role)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entityType || 'UNKNOWN'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate" title={log.description}>
                      {log.description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {isLoading && logs.length === 0 ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm || actionFilter !== 'all' ? 'No matches for current filters' : t.admin.emptyHistory}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="glass-card border-none overflow-hidden">
                <CardHeader className="bg-muted/30 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{log.admin.name}</p>
                      <p className="text-xs text-muted-foreground">{getRoleLabel(log.admin.role)}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: dateLocale })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                    <Badge variant="outline">{log.entityType || 'UNKNOWN'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t.common.page} {page + 1} - {pageRangeLabel}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasMore || isLoading}
          >
            {t.common.next}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
