'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Database, Download, Loader2, RefreshCw, Search, Table2, CalendarIcon, ChevronLeft, ChevronRight, Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

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

type WorkbookLabels = {
  scope: string
  generatedAt: string
  summary: string
  sheet: string
  rows: string
  columns: string
  description: string
  defaultSheetName: string
  overflowSheetName: string
  overflowHeaderSheet: string
  overflowHeaderRow: string
  overflowHeaderColumn: string
  overflowHeaderPart: string
  overflowHeaderValue: string
  overflowValueMarker: string
  columnPrefix: string
}

const EXCEL_CELL_TEXT_LIMIT = 32767

type WorkbookOverflowRow = {
  sheet: string
  row: number
  column: string
  part: number
  value: string
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function sanitizeWorksheetName(name: string, usedNames: Set<string>, fallbackName = 'Sheet') {
  const cleaned = name.replace(/[\\/:?*\[\]]/g, ' ').trim() || fallbackName
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

function splitExcelText(value: string, chunkSize = EXCEL_CELL_TEXT_LIMIT) {
  if (value.length <= chunkSize) return [value]
  const chunks: string[] = []
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize))
  }
  return chunks
}

function normalizeExcelCellText(
  value: string,
  context: {
    sheet: string
    row: number
    column: string
    overflowValueMarker: string
    overflowRows: WorkbookOverflowRow[]
  }
) {
  if (value.length <= EXCEL_CELL_TEXT_LIMIT) return value

  const chunks = splitExcelText(value, EXCEL_CELL_TEXT_LIMIT)
  chunks.forEach((chunk, index) => {
    context.overflowRows.push({
      sheet: context.sheet,
      row: context.row,
      column: context.column,
      part: index + 1,
      value: chunk,
    })
  })

  const marker = ` ...[${context.overflowValueMarker}]`
  const previewLimit = Math.max(0, Math.min(1200, EXCEL_CELL_TEXT_LIMIT - marker.length))
  return `${value.slice(0, previewLimit)}${marker}`
}

function buildWorkbookSheets(snapshot: SnapshotPayload, labels: WorkbookLabels) {
  const summaryRows = [
    [labels.scope, snapshot.scope],
    [labels.generatedAt, snapshot.generatedAt],
    [],
    [labels.sheet, labels.rows, labels.columns, labels.description],
    ...snapshot.summary.map((item) => [item.title, String(item.rowCount), String(item.columnCount), item.description]),
  ]

  const tableSheets: Array<{ name: string; rows: string[][] }> = snapshot.tables.map((table) => ({
    name: table.title,
    rows: [table.columns, ...table.rows.map((row) => table.columns.map((column) => row[column] ?? ''))],
  }))

  const workbookSheets: Array<{ name: string; rows: string[][] }> = [
    { name: labels.summary, rows: summaryRows.map((row) => row.map((value) => String(value ?? ''))) },
    ...tableSheets,
  ]

  return workbookSheets
}

async function downloadWorkbookXlsx(fileName: string, snapshot: SnapshotPayload, labels: WorkbookLabels) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const usedSheetNames = new Set<string>()
  const overflowRows: WorkbookOverflowRow[] = []
  const workbookSheets = buildWorkbookSheets(snapshot, labels)

  workbookSheets.forEach((sheet) => {
    const sheetName = sanitizeWorksheetName(sheet.name, usedSheetNames, labels.defaultSheetName)
    const headerRow = sheet.rows[0] ?? []
    const normalizedRows = sheet.rows.map((row, rowIndex) =>
      row.map((cell, columnIndex) => {
        const columnName =
          rowIndex > 0
            ? (headerRow[columnIndex] ?? `${labels.columnPrefix}_${columnIndex + 1}`)
            : `${labels.columnPrefix}_${columnIndex + 1}`
        return normalizeExcelCellText(String(cell ?? ''), {
          sheet: sheetName,
          row: rowIndex + 1,
          column: String(columnName),
          overflowValueMarker: labels.overflowValueMarker,
          overflowRows,
        })
      })
    )
    const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  if (overflowRows.length > 0) {
    const overflowSheetName = sanitizeWorksheetName(labels.overflowSheetName, usedSheetNames, labels.defaultSheetName)
    const overflowWorksheet = XLSX.utils.aoa_to_sheet([
      [
        labels.overflowHeaderSheet,
        labels.overflowHeaderRow,
        labels.overflowHeaderColumn,
        labels.overflowHeaderPart,
        labels.overflowHeaderValue,
      ],
      ...overflowRows.map((item) => [
        item.sheet,
        String(item.row),
        item.column,
        String(item.part),
        item.value,
      ]),
    ])
    XLSX.utils.book_append_sheet(workbook, overflowWorksheet, overflowSheetName)
  }

  try {
    const fileArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true })
    downloadBlob(
      fileName,
      new Blob([fileArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    )
  } catch {
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', compression: true })
  }
}

async function downloadSingleTableXlsx(fileName: string, table: DatabaseTable, labels: WorkbookLabels) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const overflowRows: WorkbookOverflowRow[] = []
  const sheetName = sanitizeWorksheetName(table.title, new Set<string>(), labels.defaultSheetName)
  const worksheetRows = [table.columns, ...table.rows.map((row) => table.columns.map((column) => row[column] ?? ''))]
  const headerRow = worksheetRows[0] ?? []
  const normalizedRows = worksheetRows.map((row, rowIndex) =>
    row.map((cell, columnIndex) =>
      normalizeExcelCellText(String(cell ?? ''), {
        sheet: sheetName,
        row: rowIndex + 1,
        column: String(headerRow[columnIndex] ?? `${labels.columnPrefix}_${columnIndex + 1}`),
        overflowValueMarker: labels.overflowValueMarker,
        overflowRows,
      })
    )
  )
  const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  if (overflowRows.length > 0) {
    const overflowWorksheet = XLSX.utils.aoa_to_sheet([
      [
        labels.overflowHeaderSheet,
        labels.overflowHeaderRow,
        labels.overflowHeaderColumn,
        labels.overflowHeaderPart,
        labels.overflowHeaderValue,
      ],
      ...overflowRows.map((item) => [
        item.sheet,
        String(item.row),
        item.column,
        String(item.part),
        item.value,
      ]),
    ])
    XLSX.utils.book_append_sheet(
      workbook,
      overflowWorksheet,
      sanitizeWorksheetName(labels.overflowSheetName, new Set([sheetName]), labels.defaultSheetName)
    )
  }

  try {
    const fileArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true })
    downloadBlob(
      fileName,
      new Blob([fileArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    )
  } catch {
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', compression: true })
  }
}

export default function DatabasePage() {
  const { language } = useLanguage()
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [date, setDate] = useState<DateRange | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [draftRow, setDraftRow] = useState<Record<string, string> | null>(null)
  const [draftRowTableId, setDraftRowTableId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editingRowData, setEditingRowData] = useState<Record<string, string> | null>(null)
  
  const uiText = useMemo(() => {
    if (language === 'ru') {
      return {
        accessDeniedWorkspace: 'Доступ к рабочей области базы данных Neon запрещен',
        failedLoadSnapshot: 'Не удалось загрузить снимок базы данных Neon',
        unableLoadSnapshot: 'Не удалось загрузить базу данных Neon',
        notSyncedYet: 'Еще не синхронизировано',
        workbookDownloaded: 'Excel-файл со всеми листами скачан',
        fullSheetDownloaded: 'Полный лист выгружен в Excel',
        failedDownloadWorkbook: 'Не удалось скачать книгу',
        failedDownloadSheet: 'Не удалось скачать лист',
        workspaceTitle: 'Рабочая область Neon DB',
        unknownScope: 'Неизвестно',
        workspaceDescription: (scope: string, lastSync: string) =>
          `Реальные таблицы Prisma из Neon. Область: ${scope}. Последняя синхронизация: ${lastSync}.`,
        loadingWorkspace: 'Загрузка рабочей области базы данных Neon...',
        backToMiddleAdmin: 'Назад к среднему администратору',
        sheetsCount: 'листов',
        refresh: 'Обновить',
        downloadAllSheets: 'Скачать все листы',
        askTambo: 'Спросить Tambo',
        visibleSheets: 'Видимые листы',
        totalRows: 'Всего строк',
        totalColumns: 'Всего колонок',
        allTime: 'За все время',
        database: 'База данных',
        scope: 'Область',
        generatedAt: 'Сформировано',
        summary: 'Сводка',
        allNeonSheets: 'Все листы Neon',
        allNeonSheetsDescription: 'Фактические таблицы базы данных, доступные в вашей области доступа.',
        sheet: 'Лист',
        rows: 'Строки',
        columns: 'Колонки',
        description: 'Описание',
        searchInTable: (title: string) => `Поиск в ${title}`,
        rowsCount: 'строк',
        downloadSheet: 'Скачать лист',
        noRowsMatch: 'Нет строк, подходящих под поиск.',
        defaultSheetName: 'Лист',
        overflowSheetName: 'Переполнение',
        overflowHeaderSheet: 'Лист',
        overflowHeaderRow: 'Строка',
        overflowHeaderColumn: 'Колонка',
        overflowHeaderPart: 'Часть',
        overflowHeaderValue: 'Значение',
        overflowValueMarker: 'ПОЛНОЕ_ЗНАЧЕНИЕ_В_ЛИСТЕ_ПЕРЕПОЛНЕНИЯ',
        columnPrefix: 'колонка',
        tamboPrompt: (targetLabel: string) =>
          `Проанализируй ${targetLabel} в Neon DB среднего администратора и помоги с выгрузками, сводками или исправлениями.`,
        addRow: 'Добавить строку',
        saveRow: 'Сохранить',
        cancelRow: 'Отмена',
        rowSaved: 'Строка сохранена',
        rowSaveFailed: 'Ошибка сохранения строки',
        editRow: 'Редактировать',
        saveEdit: 'Сохранить изменения',
        cancelEdit: 'Отмена',
      }
    }

    if (language === 'uz') {
      return {
        accessDeniedWorkspace: 'Neon maʼlumotlar bazasi ish maydoniga kirish taqiqlangan',
        failedLoadSnapshot: 'Neon maʼlumotlar bazasi snapshotini yuklab bo‘lmadi',
        unableLoadSnapshot: 'Neon maʼlumotlar bazasini yuklab bo‘lmadi',
        notSyncedYet: 'Hali sinxronlanmagan',
        workbookDownloaded: 'Barcha sahifalar bilan Excel fayl yuklab olindi',
        fullSheetDownloaded: 'To‘liq sahifa Excelga yuklab olindi',
        failedDownloadWorkbook: 'Excel kitobini yuklab bo‘lmadi',
        failedDownloadSheet: 'Sahifani yuklab bo‘lmadi',
        workspaceTitle: 'Neon DB ish maydoni',
        unknownScope: 'Nomaʼlum',
        workspaceDescription: (scope: string, lastSync: string) =>
          `Neon’dagi haqiqiy Prisma jadvallari. Qamrov: ${scope}. Oxirgi sinxronlash: ${lastSync}.`,
        loadingWorkspace: 'Neon maʼlumotlar bazasi ish maydoni yuklanmoqda...',
        backToMiddleAdmin: 'O‘rta administratorga qaytish',
        sheetsCount: 'sahifa',
        refresh: 'Yangilash',
        downloadAllSheets: 'Barcha sahifalarni yuklash',
        askTambo: 'Tambo’dan so‘rash',
        visibleSheets: 'Ko‘rinadigan sahifalar',
        totalRows: 'Jami qatorlar',
        totalColumns: 'Jami ustunlar',
        allTime: 'Barcha vaqt',
      database: 'Maʼlumotlar bazasi',
      scope: 'Qamrov',
      generatedAt: 'Yaratilgan vaqti',
      summary: 'Umumiy',
        allNeonSheets: 'Barcha Neon sahifalari',
        allNeonSheetsDescription: 'Sizga ruxsat etilgan qamrovdagi haqiqiy maʼlumotlar bazasi jadvallari.',
        sheet: 'Sahifa',
        rows: 'Qatorlar',
        columns: 'Ustunlar',
        description: 'Tavsif',
        searchInTable: (title: string) => `${title} ichida qidirish`,
        rowsCount: 'qator',
        downloadSheet: 'Sahifani yuklash',
        noRowsMatch: 'Qidiruvga mos qator topilmadi.',
        defaultSheetName: 'Sahifa',
        overflowSheetName: 'Toshib ketgan qiymatlar',
        overflowHeaderSheet: 'Sahifa',
        overflowHeaderRow: 'Qator',
        overflowHeaderColumn: 'Ustun',
        overflowHeaderPart: 'Qism',
        overflowHeaderValue: 'Qiymat',
        overflowValueMarker: 'TOʻLIQ_QIYMAT_TOSHISH_SAHIFASIDA',
        columnPrefix: 'ustun',
        tamboPrompt: (targetLabel: string) =>
          `O'rta administrator Neon DB'sida ${targetLabel} tahlil qiling va yuklab olish, sarhisob qilish yoki tuzatishlarda yordam bering.`,
        addRow: 'Qator qo\'shish',
        saveRow: 'Saqlash',
        cancelRow: 'Bekor qilish',
        rowSaved: 'Qator saqlandi',
        rowSaveFailed: 'Qatorni saqlashda xatolik',
        editRow: 'Tahrirlash',
        saveEdit: 'O\'zgarishlarni saqlash',
        cancelEdit: 'Bekor qilish',
      }
    }

    return {
      accessDeniedWorkspace: 'Access denied for Neon database workspace',
      failedLoadSnapshot: 'Failed to load Neon database snapshot',
      unableLoadSnapshot: 'Unable to load Neon database',
      notSyncedYet: 'Not synced yet',
      workbookDownloaded: 'Excel workbook downloaded with separate sheets',
      fullSheetDownloaded: 'Full sheet downloaded as Excel',
      failedDownloadWorkbook: 'Failed to download workbook',
      failedDownloadSheet: 'Failed to download sheet',
      workspaceTitle: 'Neon DB workspace',
      unknownScope: 'Unknown',
      workspaceDescription: (scope: string, lastSync: string) =>
        `Real Prisma tables from Neon. Scope: ${scope}. Last sync: ${lastSync}.`,
      loadingWorkspace: 'Loading Neon database workspace...',
      backToMiddleAdmin: 'Back to middle admin',
      sheetsCount: 'sheets',
      refresh: 'Refresh',
      downloadAllSheets: 'Download all sheets',
      askTambo: 'Ask Tambo',
      visibleSheets: 'Visible sheets',
      totalRows: 'Total rows',
      totalColumns: 'Total columns',
      allTime: 'All time',
      database: 'Database',
      scope: 'Scope',
      generatedAt: 'Generated At',
      summary: 'Summary',
      allNeonSheets: 'All Neon sheets',
      allNeonSheetsDescription: 'Actual database tables available in your current access scope.',
      sheet: 'Sheet',
      rows: 'Rows',
      columns: 'Columns',
      description: 'Description',
      searchInTable: (title: string) => `Search ${title}`,
      rowsCount: 'rows',
      downloadSheet: 'Download sheet',
      noRowsMatch: 'No rows match this search.',
      defaultSheetName: 'Sheet',
      overflowSheetName: 'Overflow',
      overflowHeaderSheet: 'Sheet',
      overflowHeaderRow: 'Row',
      overflowHeaderColumn: 'Column',
      overflowHeaderPart: 'Part',
      overflowHeaderValue: 'Value',
      overflowValueMarker: 'FULL_VALUE_IN_OVERFLOW_SHEET',
      columnPrefix: 'column',
      tamboPrompt: (targetLabel: string) =>
        `Analyze the ${targetLabel} in the middle admin Neon DB space and help with data extracts, summaries, or fixes.`,
      addRow: 'Add Row',
      saveRow: 'Save',
      cancelRow: 'Cancel',
      rowSaved: 'Row saved',
      rowSaveFailed: 'Failed to save row',
      editRow: 'Edit',
      saveEdit: 'Save changes',
      cancelEdit: 'Cancel',
    }
  }, [language])

  const tDb = useCallback((key: string) => {
    const dbDict: Record<string, Record<string, string>> = {
      ru: {
        'Admins': 'Админы',
        'Customers': 'Клиенты',
        'Orders': 'Заказы',
        'Transactions': 'Транзакции',
        'Websites': 'Сайты',
        'Menu Sets': 'Сеты Меню',
        'Menus': 'Меню',
        'Dishes': 'Блюда',
        'Warehouse': 'Склад',
        'Cooking Plans': 'Планы Готовки',
        'Action Logs': 'Логи',
        'Order Audit': 'Аудит',
        'name': 'имя',
        'createdAt': 'создано',
        'updatedAt': 'обновлено',
        'status': 'статус',
        'role': 'роль',
        'price': 'цена',
        'email': 'email',
        'salary': 'зарплата',
        'isActive': 'активен',
        'phone': 'телефон',
        'address': 'адрес',
        'calories': 'калории',
        'nickName': 'никнейм',
        'specialFeatures': 'особые пожелания',
        'paymentType': 'тип оплаты',
        'dailyPrice': 'цена за день',
        'amount': 'количество',
        'description': 'описание',
        'type': 'тип',
        'quantity': 'количество',
        'date': 'дата',
        'dayOfWeek': 'день недели',
        'mealType': 'прием пищи',
        'deliveryDate': 'дата доставки',
        'expectedCalories': 'ожидаемые калории',
        'totalPrice': 'общая сумма',
      },
      uz: {
        'Admins': 'Adminlar',
        'Customers': 'Mijozlar',
        'Orders': 'Buyurtmalar',
        'Transactions': 'Tranzaksiyalar',
        'Websites': 'Saytlar',
        'Menu Sets': 'Menyu Setlary',
        'Menus': 'Menyular',
        'Dishes': 'Taomlar',
        'Warehouse': 'Ombor',
        'Cooking Plans': 'Pishirish Rejalari',
        'Action Logs': 'Loglar',
        'Order Audit': 'Audit',
        'name': 'ism',
        'createdAt': 'yaratilgan',
        'updatedAt': 'yangilangan',
        'status': 'holat',
        'role': 'rol',
        'price': 'narxi',
        'email': 'email',
        'salary': 'maosh',
        'isActive': 'faol',
        'phone': 'telefon',
        'address': 'manzil',
        'calories': 'kaloriya',
        'nickName': 'laqab',
        'specialFeatures': 'maxsus isstak',
        'paymentType': 'to\'lov turi',
        'dailyPrice': 'kunlik narx',
        'amount': 'miqdor',
        'description': 'tavsif',
        'type': 'tur',
        'quantity': 'miqdor',
        'date': 'sana',
        'dayOfWeek': 'hafta kuni',
        'mealType': 'ovqatlanish turi',
        'deliveryDate': 'yetkazib berish sanasi',
        'expectedCalories': 'kutilayotgan kaloriyalar',
        'totalPrice': 'umumiy narx',
      }
    }
    return dbDict[language as string]?.[key] || key
  }, [language])

  const tDbValue = useCallback((value: string) => {
    if (value === 'null' || value === '' || value === '""' || value === '{}' || value === '[]') return '-'
    if (value === 'true') return language === 'ru' ? 'да' : 'ha'
    if (value === 'false') return language === 'ru' ? 'нет' : 'yoq'
    
    // Statuses
    const statusDict: Record<string, Record<string, string>> = {
      ru: {
        'ACTIVE': 'АКТИВЕН',
        'INACTIVE': 'НЕАКТИВЕН',
        'PAUSED': 'ПРИОСТАНОВЛЕН',
        'PENDING': 'В ОЖИДАНИИ',
        'DELIVERED': 'ДОСТАВЛЕН',
        'CANCELLED': 'ОТМЕНЕН',
        'COMPLETED': 'ЗАВЕРШЕН',
        'SUPER_ADMIN': 'СУПЕР АДМИН',
        'MIDDLE_ADMIN': 'СРЕДНИЙ АДМИН',
        'LOW_ADMIN': 'МЛАДШИЙ АДМИН',
        'COURIER': 'КУРЬЕР',
        'WORKER': 'РАБОТНИК',
      },
      uz: {
        'ACTIVE': 'FAOL',
        'INACTIVE': 'NOFAOL',
        'PAUSED': 'TO\'XTATILGAN',
        'PENDING': 'KUTILMOQDA',
        'DELIVERED': 'YETKAZILGAN',
        'CANCELLED': 'BEKOR QILINGAN',
        'COMPLETED': 'YAKUNLANGAN',
        'SUPER_ADMIN': 'SUPER ADMIN',
        'MIDDLE_ADMIN': 'O\'RTA ADMIN',
        'LOW_ADMIN': 'KICHIK ADMIN',
        'COURIER': 'KURYER',
        'WORKER': 'ISHCHI',
      }
    }

    // Attempt to parse JSON objects to make them readable
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length === 0) return '-'
        return JSON.stringify(parsed, null, 2).replace(/[{}[\]"]/g, '').split('\n').map(line => line.trim()).filter(Boolean).join(', ')
      } catch (e) {
        return value
      }
    }

    return statusDict[language as string]?.[value] || value
  }, [language])

  const loadSnapshot = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      let url = '/api/admin/database-snapshot'
      if (date?.from && date?.to) {
        url += `?start=${date.from.toISOString()}&end=${addDays(date.to, 1).toISOString()}`
      } else if (date?.from) {
        url += `?start=${date.from.toISOString()}&end=${addDays(date.from, 1).toISOString()}`
      }
      const response = await fetch(url, { cache: 'no-store' })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (response.status === 403) {
        toast.error(uiText.accessDeniedWorkspace)
        return
      }

      const data = (await response.json().catch(() => null)) as SnapshotPayload | null
      if (!response.ok || !data) {
        throw new Error(uiText.failedLoadSnapshot)
      }

      setSnapshot(data)
      setActiveTab((currentTab) =>
        currentTab === 'summary' || data.tables.some((table) => table.id === currentTab)
          ? currentTab
          : 'summary'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : uiText.unableLoadSnapshot)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router, uiText.accessDeniedWorkspace, uiText.failedLoadSnapshot, uiText.unableLoadSnapshot, date])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])



  const tables = useMemo(() => snapshot?.tables ?? [], [snapshot?.tables])
  const summary = useMemo(() => snapshot?.summary ?? [], [snapshot?.summary])
  const totalRows = useMemo(() => summary.reduce((sum, item) => sum + item.rowCount, 0), [summary])
  const totalColumns = useMemo(() => summary.reduce((sum, item) => sum + item.columnCount, 0), [summary])
  const lastSyncedLabel = useMemo(() => {
    if (!snapshot?.generatedAt) return uiText.notSyncedYet
    return new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [snapshot?.generatedAt, uiText.notSyncedYet])

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

  const handleSaveDraftRow = async () => {
    if (!currentTable || !draftRow || !draftRowTableId) return
    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/admin/database-row', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: draftRowTableId,
          data: draftRow,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || uiText.rowSaveFailed)
      }

      toast.success(uiText.rowSaved)
      setDraftRow(null)
      setDraftRowTableId(null)
      void loadSnapshot(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : uiText.rowSaveFailed)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleUpdateRow = async () => {
    if (!currentTable || !editingRowData || !editingRowId) return
    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/admin/database-row', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable.id,
          id: editingRowId,
          data: editingRowData,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || uiText.rowSaveFailed)

      toast.success(uiText.rowSaved)
      setEditingRowId(null)
      setEditingRowData(null)
      void loadSnapshot(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : uiText.rowSaveFailed)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleDownloadUnifiedSnapshot = async () => {
    if (!snapshot) return

    const generatedAt = new Date(snapshot.generatedAt).toISOString().slice(0, 10)
    await downloadWorkbookXlsx(`neon-database-full-${generatedAt}.xlsx`, snapshot, {
      scope: uiText.scope,
      generatedAt: uiText.generatedAt,
      summary: uiText.summary,
      sheet: uiText.sheet,
      rows: uiText.rows,
      columns: uiText.columns,
      description: uiText.description,
      defaultSheetName: uiText.defaultSheetName,
      overflowSheetName: uiText.overflowSheetName,
      overflowHeaderSheet: uiText.overflowHeaderSheet,
      overflowHeaderRow: uiText.overflowHeaderRow,
      overflowHeaderColumn: uiText.overflowHeaderColumn,
      overflowHeaderPart: uiText.overflowHeaderPart,
      overflowHeaderValue: uiText.overflowHeaderValue,
      overflowValueMarker: uiText.overflowValueMarker,
      columnPrefix: uiText.columnPrefix,
    })
    toast.success(uiText.workbookDownloaded)
  }

  const handleDownloadCurrentTable = async () => {
    if (!currentTable || !snapshot) return

    const generatedAt = new Date(snapshot.generatedAt).toISOString().slice(0, 10)
    await downloadSingleTableXlsx(`neon-${currentTable.id}-${generatedAt}.xlsx`, currentTable, {
      scope: uiText.scope,
      generatedAt: uiText.generatedAt,
      summary: uiText.summary,
      sheet: uiText.sheet,
      rows: uiText.rows,
      columns: uiText.columns,
      description: uiText.description,
      defaultSheetName: uiText.defaultSheetName,
      overflowSheetName: uiText.overflowSheetName,
      overflowHeaderSheet: uiText.overflowHeaderSheet,
      overflowHeaderRow: uiText.overflowHeaderRow,
      overflowHeaderColumn: uiText.overflowHeaderColumn,
      overflowHeaderPart: uiText.overflowHeaderPart,
      overflowHeaderValue: uiText.overflowHeaderValue,
      overflowValueMarker: uiText.overflowValueMarker,
      columnPrefix: uiText.columnPrefix,
    })
    toast.success(`${currentTable.title}: ${uiText.fullSheetDownloaded}`)
  }

  const handleDownloadUnifiedSnapshotClick = () => {
    void handleDownloadUnifiedSnapshot().catch((error) => {
      toast.error(error instanceof Error ? error.message : uiText.failedDownloadWorkbook)
    })
  }

  const handleDownloadCurrentTableClick = () => {
    void handleDownloadCurrentTable().catch((error) => {
      toast.error(error instanceof Error ? error.message : uiText.failedDownloadSheet)
    })
  }

  const handleOpenTambo = () => {
    const targetLabel = currentTable?.title ?? uiText.workspaceTitle
    window.dispatchEvent(
      new CustomEvent('tambo:open-chat', {
        detail: {
          prompt: uiText.tamboPrompt(targetLabel),
        },
      })
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{uiText.loadingWorkspace}</p>
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
                {uiText.workspaceTitle}
              </CardTitle>
              <CardDescription>
                {uiText.workspaceDescription(snapshot?.scope ?? uiText.unknownScope, lastSyncedLabel)}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/middle-admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {uiText.backToMiddleAdmin}
                </Link>
              </Button>
              <Badge variant="secondary" className="h-8 rounded-full px-3 hidden sm:inline-flex">
                {tables.length} {uiText.sheetsCount}
              </Badge>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[260px] justify-start bg-background dark:bg-black/50 overflow-hidden text-zinc-900 dark:text-white border-black/10 dark:border-white/[0.08]">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>{uiText.allTime}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                  />
                  <div className="p-3 border-t border-black/5 dark:border-white/10">
                    <Button 
                      variant="ghost" 
                      className="w-full h-8 text-xs font-semibold justify-center hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={() => setDate(undefined)}
                    >
                      {uiText.allTime}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={() => void loadSnapshot(true)} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {uiText.refresh}
              </Button>
              <Button variant="outline" onClick={handleDownloadUnifiedSnapshotClick}>
                <Download className="mr-2 h-4 w-4" />
                {uiText.downloadAllSheets}
              </Button>
              <Button onClick={handleOpenTambo}>
                <Bot className="mr-2 h-4 w-4" />
                {uiText.askTambo}
              </Button>
              <LanguageSwitcher />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">{uiText.visibleSheets}</p>
              <p className="mt-2 text-3xl font-semibold">{tables.length}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">{uiText.totalRows}</p>
              <p className="mt-2 text-3xl font-semibold">{totalRows}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">{uiText.totalColumns}</p>
              <p className="mt-2 text-3xl font-semibold">{totalColumns}</p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">{uiText.database}</p>
              <p className="mt-2 text-3xl font-semibold">Neon</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary" className="gap-1.5">
                <Table2 className="h-4 w-4" />
                {uiText.summary}
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
                  <p className="text-sm font-semibold">{uiText.allNeonSheets}</p>
                  <p className="text-xs text-muted-foreground">{uiText.allNeonSheetsDescription}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{uiText.sheet}</TableHead>
                      <TableHead>{uiText.rows}</TableHead>
                      <TableHead>{uiText.columns}</TableHead>
                      <TableHead>{uiText.description}</TableHead>
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
                    <p className="text-lg font-semibold">{tDb(table.title)}</p>
                    <p className="text-sm text-muted-foreground">{table.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full min-w-[260px] max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={activeTab === table.id ? searchTerm : ''}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={uiText.searchInTable(table.title)}
                        className="pl-9"
                      />
                    </div>
                    <Badge variant="outline" className="h-9 rounded-full px-3">
                      {filteredRows.length} / {table.rowCount} {uiText.rowsCount}
                    </Badge>
                    <Button variant="outline" onClick={handleDownloadCurrentTableClick}>
                      <Download className="mr-2 h-4 w-4" />
                      {uiText.downloadSheet}
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
                              {tDb(column)}
                            </TableHead>
                          ))}
                          <TableHead className="w-[100px] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.length > 0 ? (
                          filteredRows.map((row, index) => (
                            editingRowId === row.id && row.id ? (
                              <TableRow key={`${table.id}-editing-${index}`} className="bg-muted/30">
                                {table.columns.map((column) => (
                                  <TableCell key={`editing-${column}`}>
                                    {column === 'id' || column === 'createdAt' || column === 'updatedAt' ? (
                                      <div className="text-xs text-muted-foreground whitespace-nowrap">{row[column] || '-'}</div>
                                    ) : (
                                      <Input
                                        value={editingRowData?.[column] || ''}
                                        onChange={(e) => setEditingRowData(prev => ({ ...(prev || {}), [column]: e.target.value }))}
                                        className="min-w-[120px] h-8 text-sm"
                                        disabled={isSavingDraft}
                                      />
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right">
                                  <div className="flex flex-col gap-2 justify-end">
                                    <Button size="sm" onClick={handleUpdateRow} disabled={isSavingDraft}>
                                      {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : uiText.saveEdit}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingRowId(null); setEditingRowData(null) }}>
                                      {uiText.cancelEdit}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow key={`${table.id}-${index}`}>
                                {table.columns.map((column) => (
                                  <TableCell key={`${table.id}-${index}-${column}`} className="max-w-[320px] align-top">
                                    <div className="line-clamp-4 whitespace-pre-wrap break-words text-sm">
                                      {tDbValue(row[column] || '-')}
                                    </div>
                                  </TableCell>
                                ))}
                                <TableCell className="text-right align-top">
                                  {row.id ? (
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingRowId(row.id as string); setEditingRowData(row as Record<string, string>) }}>
                                      <Edit className="h-4 w-4 mr-1" />
                                      {uiText.editRow}
                                    </Button>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            )
                          ))
                        ) : draftRowTableId !== table.id ? (
                          <TableRow>
                            <TableCell colSpan={table.columns.length + 1} className="py-10 text-center text-sm text-muted-foreground">
                              {uiText.noRowsMatch}
                            </TableCell>
                          </TableRow>
                        ) : null}
                        
                        {draftRowTableId === table.id && draftRow !== null && (
                          <TableRow className="bg-muted/30">
                            {table.columns.map((column) => (
                              <TableCell key={`draft-${column}`}>
                                {column === 'id' ? (
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">Auto-generated</div>
                                ) : column === 'createdAt' || column === 'updatedAt' ? (
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">Auto-timed</div>
                                ) : (
                                  <Input
                                    value={draftRow[column] || ''}
                                    onChange={(e) => setDraftRow(prev => ({ ...(prev || {}), [column]: e.target.value }))}
                                    placeholder={`Enter ${column}...`}
                                    className="min-w-[120px] h-8 text-sm"
                                    disabled={isSavingDraft}
                                  />
                                )}
                              </TableCell>
                            ))}
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {draftRowTableId === table.id && draftRow !== null ? (
                    <div className="p-4 border-t flex justify-end gap-2 bg-muted/10">
                      <Button variant="ghost" onClick={() => { setDraftRow(null); setDraftRowTableId(null) }} disabled={isSavingDraft}>
                        {uiText.cancelRow}
                      </Button>
                      <Button onClick={() => void handleSaveDraftRow()} disabled={isSavingDraft}>
                        {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {uiText.saveRow}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 border-t flex justify-center bg-muted/10">
                      <Button variant="outline" onClick={() => { setDraftRow({}); setDraftRowTableId(table.id) }}>
                        <Plus className="mr-2 h-4 w-4" />
                        {uiText.addRow}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
