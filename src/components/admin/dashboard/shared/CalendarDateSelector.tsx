import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CalendarDateSelectorProps {
  selectedDate: Date | null
  applySelectedDate: (date: Date | null) => void
  shiftSelectedDate?: (days: number) => void
  selectedDateLabel: string
  showShiftButtons?: boolean
  profileUiText: {
    calendar: string
    today: string
    clearDate: string
    yesterday: string
    tomorrow: string
  }
}

export function CalendarDateSelector({
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedDateLabel,
  showShiftButtons = true,
  profileUiText,
}: CalendarDateSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="h-9 min-w-[240px] justify-between gap-2 px-3 text-left">
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-medium">{selectedDateLabel}</span>
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {profileUiText.calendar}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate ?? undefined}
          onSelect={(nextDate) => applySelectedDate(nextDate ?? null)}
          initialFocus
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => applySelectedDate(new Date())}>
            {profileUiText.today}
          </Button>
          {selectedDate ? (
            <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => applySelectedDate(null)}>
              {profileUiText.clearDate}
            </Button>
          ) : null}
        </div>
        {showShiftButtons && shiftSelectedDate ? (
          <div className="flex flex-col gap-2 px-3 pb-2">
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="flex-1 h-8" onClick={() => shiftSelectedDate(-1)}>
                {profileUiText.yesterday}
              </Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-8" onClick={() => shiftSelectedDate(1)}>
                {profileUiText.tomorrow}
              </Button>
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
