# Calendar Dialog Implementation Plan

## Overview
Add the custom calendar dialog window from AdminsTab to the following tabs:
- OrdersTab
- ClientsTab (Customers)
- HistoryTab
- WarehouseTab
- FinanceTab
- BinTab

## Current State Analysis

### AdminsTab Calendar Dialog
The AdminsTab has a custom calendar dialog implementation with:
- Full-screen modal dialog with backdrop blur (z-index: 999)
- Custom calendar rendering with day/week/month navigation
- Date range selection (start date + end date)
- Motion animations using framer-motion
- Uzbek language labels (Du, Se, Ch, Pa, Ju, Sh, Ya for days)
- State management: `isDatePickerOpen`, `currentMonth`, `draftStartDate`, `draftEndDate`
- Functions: `openDatePicker`, `closeDatePicker`, `handleDateClick`, `renderCalendar`, `applyDraftRange`, `resetDraftRange`

### Other Tabs Current Implementation
- **OrdersTab**: Uses `CalendarDateSelector` (popover-based)
- **ClientsTab**: Uses `CalendarDateSelector` (popover-based)
- **HistoryTab**: Uses `CalendarDateSelector` (popover-based)
- **WarehouseTab**: Uses `CalendarRangeSelector` (popover-based)
- **FinanceTab**: Uses `CalendarDateSelector` (popover-based)
- **BinTab**: No calendar functionality

## Implementation Approach

### Step 1: Create Reusable CalendarDialog Component
Create a new reusable component at `src/components/admin/dashboard/shared/CalendarDialog.tsx`

**Component Features:**
- Extract calendar dialog logic from AdminsTab
- Accept props for:
  - `isOpen`: boolean - controls dialog visibility
  - `onClose`: () => void - close handler
  - `selectedDate`: Date | null - currently selected single date
  - `selectedPeriod`: DateRange | undefined - currently selected date range
  - `onApplyDate`: (date: Date) => void - apply single date
  - `onApplyPeriod`: (range: DateRange) => void - apply date range
  - `locale`: string - for day labels (default: 'en')
  - `uiText`: object - localized text for buttons/labels

**Key Functions to Extract:**
- `renderCalendar()` - renders the calendar grid
- `handleDateClick()` - handles day selection
- `applyDraftRange()` - applies selected range
- `resetDraftRange()` - resets to today

### Step 2: Update Each Target Tab

For each tab, the following changes are needed:

#### 2.1 Add State Variables
```typescript
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
const [currentMonth, setCurrentMonth] = useState<Date>(() =>
  startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
)
const [draftStartDate, setDraftStartDate] = useState<Date>(() =>
  startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
)
const [draftEndDate, setDraftEndDate] = useState<Date | null>(() =>
  selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
)
```

#### 2.2 Add Effect for Body Scroll Lock
```typescript
useEffect(() => {
  if (!isDatePickerOpen) return
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => {
    document.body.style.overflow = prev
  }
}, [isDatePickerOpen])
```

#### 2.3 Add Helper Functions
```typescript
const openDatePicker = useCallback(() => {
  const from = startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
  const to = selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
  setDraftStartDate(from)
  setDraftEndDate(to && !isSameDay(from, to) ? to : null)
  setCurrentMonth(from)
  setIsDatePickerOpen(true)
}, [selectedDate, selectedPeriod?.from, selectedPeriod?.to])

const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])

const applyDraftRange = useCallback(() => {
  if (typeof applySelectedPeriod === 'function') {
    applySelectedPeriod({ from: draftStartDate, to: draftEndDate ?? draftStartDate })
    closeDatePicker()
    return
  }
  if (typeof applySelectedDate === 'function') {
    applySelectedDate(draftStartDate)
  }
  closeDatePicker()
}, [applySelectedDate, applySelectedPeriod, closeDatePicker, draftEndDate, draftStartDate])

const resetDraftRange = useCallback(() => {
  const today = startOfDay(new Date())
  setDraftStartDate(today)
  setDraftEndDate(null)
  setCurrentMonth(today)
  if (typeof applySelectedPeriod === 'function') {
    applySelectedPeriod({ from: today, to: today })
  } else if (typeof applySelectedDate === 'function') {
    applySelectedDate(today)
  }
  closeDatePicker()
}, [applySelectedDate, applySelectedPeriod, closeDatePicker])
```

#### 2.4 Replace CalendarDateSelector with Custom Trigger
Replace the existing `CalendarDateSelector` component with a custom button that opens the dialog:

```typescript
<motion.button
  whileTap={{ x: 0 }}
  onClick={openDatePicker}
  className="w-[50px] h-[50px] md:w-auto md:h-[50px] flex items-center gap-4 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 group cursor-pointer transition-colors duration-300"
>
  <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
    <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text md:mr-3" />
    <span className="hidden md:inline font-bold text-sm md:text-lg text-gourmet-ink dark:text-dark-text whitespace-nowrap">
      {appliedRangeLabel}
    </span>
  </div>
</motion.button>
```

#### 2.5 Add CalendarDialog Component
Add the CalendarDialog component at the end of the tab content:

```typescript
<AnimatePresence>
  {isDatePickerOpen && (
    <CalendarDialog
      isOpen={isDatePickerOpen}
      onClose={closeDatePicker}
      selectedDate={selectedDate}
      selectedPeriod={selectedPeriod}
      onApplyDate={applySelectedDate}
      onApplyPeriod={applySelectedPeriod}
      locale={calendarLocale}
      uiText={{
        reset: 'Reset',
        cancel: 'Bekor qilish',
        apply: 'Tayyor',
        days: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
      }}
    />
  )}
</AnimatePresence>
```

### Step 3: Tab-Specific Considerations

#### OrdersTab
- Already has `selectedDate`, `applySelectedDate`, `selectedPeriod`, `applySelectedPeriod` props
- Has `CalendarDateSelector` to replace
- Has `appliedRangeLabel` computed value

#### ClientsTab
- Already has `selectedDate`, `applySelectedDate`, `selectedPeriod`, `applySelectedPeriod` props
- Has `CalendarDateSelector` to replace
- Has `appliedRangeLabel` computed value

#### HistoryTab
- Already has `selectedDate`, `applySelectedDate`, `selectedPeriod`, `applySelectedPeriod` props
- Has `CalendarDateSelector` to replace
- Has `dateLocale` for localization

#### WarehouseTab
- Uses `CalendarRangeSelector` directly (not `CalendarDateSelector`)
- Has `calcRange` and `cookingRange` state variables
- May need separate calendar dialogs for different sub-tabs
- Already has `auditUiText.calendarUiText` for localization

#### FinanceTab
- Already has `selectedDate`, `applySelectedDate`, `selectedPeriod`, `applySelectedPeriod` props
- Has `CalendarDateSelector` to replace
- Has `calendarLocale` for localization

#### BinTab
- Currently has NO calendar functionality
- Needs to add date filtering props to interface
- May need to add date filtering logic for deleted items

### Step 4: Required Imports
Each tab will need these additional imports:

```typescript
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
} from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { CalendarDialog } from '@/components/admin/dashboard/shared/CalendarDialog'
```

## File Structure

```
src/components/admin/dashboard/shared/
├── CalendarDateSelector.tsx (existing)
├── CalendarRangeSelector.tsx (existing)
└── CalendarDialog.tsx (NEW)

src/components/admin/dashboard/tabs-content/
├── AdminsTab.tsx (reference implementation)
├── OrdersTab.tsx (to be updated)
├── ClientsTab.tsx (to be updated)
├── HistoryTab.tsx (to be updated)
├── BinTab.tsx (to be updated)
```

src/components/admin/
├── FinanceTab.tsx (to be updated)
└── WarehouseTab.tsx (to be updated)
```

## Testing Checklist

After implementation, verify:
- [ ] Calendar dialog opens on button click
- [ ] Calendar dialog closes on backdrop click
- [ ] Calendar dialog closes on X button click
- [ ] Calendar dialog closes on "Bekor qilish" (Cancel) button
- [ ] Date selection works (single date)
- [ ] Date range selection works (start + end date)
- [ ] "Tayyor" (Apply) button applies selected date/range
- [ ] "Reset" button resets to today
- [ ] Month navigation works (previous/next)
- [ ] Selected dates are highlighted
- [ ] Date range is visually indicated
- [ ] Body scroll is locked when dialog is open
- [ ] Dialog works on mobile (responsive)
- [ ] Dark mode styling works correctly
- [ ] All tabs have consistent calendar behavior

## Notes

- The AdminsTab implementation uses Uzbek language labels for days and buttons
- Consider making the UI text configurable for internationalization
- The calendar uses Monday as the first day of the week (weekStartsOn: 1)
- The dialog has z-index 999 to ensure it appears above other content
- Motion animations provide smooth open/close transitions
