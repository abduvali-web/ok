'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Database, Download, Loader2, RefreshCw, Search, Table2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DatabaseTable = {
  id: string
  title: string
  description: string
  rowCount: number
  columns: string[]
  rows: Record<string, string>[]
}

type DatabaseSummaryRow = {
  id: string
  title: string
  description: string
  rowCount: number
  columnCount: number
}

type SnapshotPayload = {
  ok: boolean
  generatedAt: string
  scope: string
  tables: DatabaseTable[]
  summary: DatabaseSummaryRow[]
}

function sanitizeWorksheetName(name: string, usedNames: Set<string>) {
  const cleaned = name.replace(/[\\/:?*\[\]]/g, ' ').trim() || 'Sheet'
  const base = cleaned.slice(0, 31)
  let candidate = base
  let counter = 2

  while (usedNames.has(candidate)) {
    const suffix = ` ${counter}`
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`
    counter += 1
  }

  usedNames.add(candidate)
  return candidate
}

function buildWorkbookSheets(snapshot: SnapshotPayload) {
  const summaryRows = [
    ['Scope', snapshot.scope],
    ['Generated At', snapshot.generatedAt],
    [],
    ['Sheet', 'Rows', 'Columns', 'Description'],
    ...snapshot.summary.map((item) => [item.title, String(item.rowCount), String(item.columnCount), item.description]),
  ]

  const workbookSheets: Array<{ name: string; rows: string[][] }> = [
    { name: 'Summary', rows: summaryRows.map((row) => row.map((value) => String(value ?? ''))) },
    ...snapshot.tables.map((table) => ({
      name: table.title,
      rows: [table.columns, ...table.rows.map((row) => table.columns.map((column) => row[column] ?? ''))],
    })),
  ]

  return workbookSheets
}

function buildSingleTableSnapshot(table: DatabaseTable, snapshot: SnapshotPayload) {
  const singleSnapshot: SnapshotPayload = {
    ok: snapshot.ok,
    generatedAt: snapshot.generatedAt,
    scope: snapshot.scope,
    summary: [
      {
        id: table.id,
        title: table.title,
        description: table.description,
        rowCount: table.rowCount,
        columnCount: table.columns.length,
      },
    ],
    tables: [table],
  }

  return singleSnapshot
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function downloadWorkbookXlsx(fileName: string, snapshot: SnapshotPayload) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const usedSheetNames = new Set<string>()
  const workbookSheets = buildWorkbookSheets(snapshot)

  workbookSheets.forEach((sheet) => {
    const sheetName = sanitizeWorksheetName(sheet.name, usedSheetNames)
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  const fileArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([fileArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(fileName, blob)
}

export default function DatabasePage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadSnapshot = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch('/api/admin/database-snapshot', { cache: 'no-store' })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (response.status === 403) {
        toast.error('Access denied for Neon database workspace')
        return
      }

      const data = (await response.json().catch(() => null)) as SnapshotPayload | null
      if (!response.ok || !data) {
        throw new Error('Failed to load Neon database snapshot')
      }

      setSnapshot(data)
      setActiveTab((currentTab) =>
        currentTab === 'summary' || data.tables.some((table) => table.id === currentTab)
          ? currentTab
          : 'summary'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load Neon database')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const tables = useMemo(() => snapshot?.tables ?? [], [snapshot?.tables])
  const summary = useMemo(() => snapshot?.summary ?? [], [snapshot?.summary])
  const totalRows = useMemo(() => summary.reduce((sum, item) => sum + item.rowCount, 0), [summary])
  const totalColumns = useMemo(() => summary.reduce((sum, item) => sum + item.columnCount, 0), [summary])
  const lastSyncedLabel = useMemo(() => {
    if (!snapshot?.generatedAt) return 'Not synced yet'
    return new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [snapshot?.generatedAt])

  const currentTable = useMemo(
    () => tables.find((table) => table.id === activeTab) ?? null,
    [activeTab, tables]
  )

  const filteredRows = useMemo(() => {
    if (!currentTable) return []
    const query = searchTerm.trim().toLowerCase()
    if (!query) return currentTable.rows
    return currentTable.rows.filter((row) =>
      currentTable.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(query))
    )
  }, [currentTable, searchTerm])

  const handleDownloadUnifiedSnapshot = async () => {
    if (!snapshot) return

    const generatedAt = new Date(snapshot.generatedAt).toISOString().slice(0, 10)
    await downloadWorkbookXlsx(`neon-database-full-${generatedAt}.xlsx`, snapshot)
    toast.success('Excel workbook downloaded with separate sheets')
  }

  const handleDownloadCurrentTable = async () => {
    if (!currentTable || !snapshot) return

    const generatedAt = new Date(snapshot.generatedAt).toISOString().slice(0, 10)
    const exportTable: DatabaseTable = {
      ...currentTable,
      rowCount: filteredRows.length,
      rows: filteredRows,
    }
    const singleSnapshot = buildSingleTableSnapshot(exportTable, snapshot)
    await downloadWorkbookXlsx(`neon-${currentTable.id}-${generatedAt}.xlsx`, singleSnapshot)
    toast.success(`${currentTable.title} sheet downloaded as Excel`)
  }

  const handleDownloadUnifiedSnapshotClick = () => {
    void handleDownloadUnifiedSnapshot().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to download workbook')
    })
  }

  const handleDownloadCurrentTableClick = () => {
    void handleDownloadCurrentTable().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to download sheet')
    })
  }

  const handleOpenTambo = () => {
    const targetLabel = currentTable?.title ?? 'Neon database workspace'
    window.dispatchEvent(
      new CustomEvent('tambo:open-chat', {
        detail: {
          prompt: `Analyze the ${targetLabel} in middle admin Neon DB and help me with exports, summaries, or fixes.`,
        },
      })
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading Neon database workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-card via-card to-muted/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Neon DB workspace
              </CardTitle>
              <CardDescription>
                Real Prisma tables from Neon. Scope: {snapshot?.scope ?? 'Unknown'}. Last sync: {lastSyncedLabel}.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/middle-admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to middle admin
                </Link>
              </Button>
              <Badge variant="secondary" className="h-8 rounded-full px-3">
                {tables.length} sheets
              </Badge>
              <Button variant="outline" onClick={() => void loadSnapshot(true)} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleDownloadUnifiedSnapshotClick}>
                <Download className="mr-2 h-4 w-4" />
                Download all sheets
              </Button>
              <Button onClick={handleOpenTambo}>
                <Bot className="mr-2 h-4 w-4" />
                Ask Tambo
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Visible sheets</p>
              <p className="mt-2 text-3xl font-semibold">{tables.length}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Total rows</p>
              <p className="mt-2 text-3xl font-semibold">{totalRows}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Total columns</p>
              <p className="mt-2 text-3xl font-semibold">{totalColumns}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="mt-2 text-3xl font-semibold">Neon</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary" className="gap-1.5">
                <Table2 className="h-4 w-4" />
                Summary
              </TabsTrigger>
              {tables.map((table) => (
                <TabsTrigger key={table.id} value={table.id}>
                  {table.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="rounded-2xl border">
                <div className="border-b p-4">
                  <p className="text-sm font-semibold">All Neon sheets</p>
                  <p className="text-xs text-muted-foreground">Actual database tables available in your current access scope.</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sheet</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.rowCount}</TableCell>
                        <TableCell>{item.columnCount}</TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {tables.map((table) => (
              <TabsContent key={table.id} value={table.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/60 p-4">
                  <div>
                    <p className="text-lg font-semibold">{table.title}</p>
                    <p className="text-sm text-muted-foreground">{table.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full min-w-[260px] max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={activeTab === table.id ? searchTerm : ''}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={`Search ${table.title}`}
                        className="pl-9"
                      />
                    </div>
                    <Badge variant="outline" className="h-9 rounded-full px-3">
                      {filteredRows.length} / {table.rowCount} rows
                    </Badge>
                    <Button variant="outline" onClick={handleDownloadCurrentTableClick}>
                      <Download className="mr-2 h-4 w-4" />
                      Download sheet
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.columns.map((column) => (
                            <TableHead key={column} className="min-w-[160px] whitespace-nowrap">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.length > 0 ? (
                          filteredRows.map((row, index) => (
                            <TableRow key={`${table.id}-${index}`}>
                              {table.columns.map((column) => (
                                <TableCell key={`${table.id}-${index}-${column}`} className="max-w-[320px] align-top">
                                  <div className="line-clamp-4 whitespace-pre-wrap break-words text-sm">
                                    {row[column] || '-'}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={table.columns.length} className="py-10 text-center text-sm text-muted-foreground">
                              No rows match this search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
