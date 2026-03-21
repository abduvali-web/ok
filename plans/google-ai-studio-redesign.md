# Google AI Studio Design System Redesign Plan

## Overview
Complete redesign of the entire application to match Google AI Studio's design language. This involves replacing the current gourmet-themed design system with a modern, dark-themed, VS Code-inspired design.

## Design System Analysis

### Google AI Studio Design Characteristics

**Color Palette (Dark Theme)**
- Background: `#1f1f1f` (VS Code dark)
- Surface: `#252526` (slightly lighter)
- Surface Container: `#2c2c2d`
- Text: `#cccccc` (light gray)
- Primary Accent: `#007acc` (VS Code blue)
- Secondary Accent: `#3794ff` (lighter blue)
- Success: `#89d185` (green)
- Warning: `#cca700` (yellow)
- Error: `#f14c4c` (red)
- Border: `#454545`
- Input: `#3c3c3c`

**Typography**
- Font: Inter, system-ui, sans-serif
- Font sizes: 12px (xs), 14px (sm), 16px (base), 18px (lg)
- Font weights: 400 (regular), 500 (medium), 600 (semibold)
- Line heights: 1.5 (base), 1.75 (lg)

**Spacing**
- Base unit: 4px
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32px

**Border Radius**
- Small: 4px
- Medium: 8px
- Large: 12px
- Full: 9999px (for circles)

**Shadows**
- Small: `0 1px 2px rgba(0,0,0,0.1)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Large: `0 10px 15px rgba(0,0,0,0.1)`

**Components**
- Cards: Dark background with subtle border
- Buttons: Flat design with hover states
- Inputs: Dark background with light border
- Tables: Minimal borders, alternating row colors
- Modals: Backdrop blur, centered content
- Tabs: Pill-shaped, active state highlighted

## Implementation Plan

### Phase 1: Design System Foundation

#### 1.1 Update Global CSS Variables
**File:** `src/app/globals.css`

Replace current color variables with Google AI Studio palette:

```css
:root {
  /* Light Theme (optional, can be removed if dark-only) */
  --background: #ffffff;
  --foreground: #1f1f1f;
  --card: #f5f5f5;
  --card-foreground: #1f1f1f;
  --popover: #ffffff;
  --popover-foreground: #1f1f1f;
  --primary: #007acc;
  --primary-foreground: #ffffff;
  --secondary: #e0e0e0;
  --secondary-foreground: #1f1f1f;
  --muted: #f5f5f5;
  --muted-foreground: #6e6e6e;
  --accent: #007acc;
  --accent-foreground: #ffffff;
  --border: #e0e0e0;
  --input: #e0e0e0;
  --ring: #007acc;
  --destructive: #f14c4c;
  --destructive-foreground: #ffffff;
  --success: #89d185;
  --warning: #cca700;
  --info: #3794ff;
}

.dark {
  /* Dark Theme (default) */
  --background: #1f1f1f;
  --foreground: #cccccc;
  --card: #252526;
  --card-foreground: #cccccc;
  --popover: #252526;
  --popover-foreground: #cccccc;
  --primary: #007acc;
  --primary-foreground: #ffffff;
  --secondary: #3c3c3c;
  --secondary-foreground: #cccccc;
  --muted: #2c2c2d;
  --muted-foreground: #858585;
  --accent: #007acc;
  --accent-foreground: #ffffff;
  --border: #454545;
  --input: #3c3c3c;
  --ring: #007acc;
  --destructive: #f14c4c;
  --destructive-foreground: #ffffff;
  --success: #89d185;
  --warning: #cca700;
  --info: #3794ff;
  
  /* Sidebar specific */
  --sidebar: #252526;
  --sidebar-foreground: #cccccc;
  --sidebar-primary: #007acc;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #3c3c3c;
  --sidebar-accent-foreground: #cccccc;
  --sidebar-border: #454545;
  --sidebar-ring: #007acc;
}
```

#### 1.2 Update Tailwind Config
**File:** `tailwind.config.ts`

Update color palette to match new design system:

```typescript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))'
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))'
  },
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))'
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))'
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))'
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))'
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))'
},
borderRadius: {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
}
```

### Phase 2: Component Updates

#### 2.1 Update UI Components
**Files to modify:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/badge.tsx`

**Button Component Changes:**
- Remove gourmet-themed colors
- Use flat design with subtle hover states
- Add focus ring on primary color
- Update border radius to 8px

**Card Component Changes:**
- Dark background with subtle border
- Remove gourmet-themed shadows
- Add subtle hover effect

**Input Component Changes:**
- Dark background (#3c3c3c)
- Light border (#454545)
- Focus ring on primary color
- Remove rounded-full, use rounded-md

**Table Component Changes:**
- Minimal borders
- Alternating row colors (transparent and #2c2c2d)
- Remove gourmet-themed styling

**Dialog Component Changes:**
- Backdrop blur effect
- Dark background (#252526)
- Rounded corners (12px)
- Remove gourmet-themed styling

**Tabs Component Changes:**
- Pill-shaped design
- Active state with primary color background
- Remove gourmet-themed styling

#### 2.2 Update Admin Dashboard Components
**Files to modify:**
- `src/components/admin/AdminDashboardPage.tsx`
- `src/components/admin/dashboard/tabs-content/AdminsTab.tsx`
- `src/components/admin/dashboard/tabs-content/OrdersTab.tsx`
- `src/components/admin/dashboard/tabs-content/ClientsTab.tsx`
- `src/components/admin/dashboard/tabs-content/HistoryTab.tsx`
- `src/components/admin/WarehouseTab.tsx`
- `src/components/admin/FinanceTab.tsx`
- `src/components/admin/dashboard/tabs-content/BinTab.tsx`
- `src/components/admin/OrdersTable.tsx`
- `src/components/admin/HistoryTable.tsx`

**Changes:**
- Remove gourmet-themed colors (gourmet-green, gourmet-cream, etc.)
- Replace with new color palette
- Update card styling
- Update button styling
- Update table styling
- Remove rounded-full, use rounded-lg
- Remove gourmet-themed shadows and borders

#### 2.3 Update Courier Page Components
**Files to modify:**
- `src/app/courier/page.tsx`
- `src/components/courier/CourierMap.tsx`
- `src/components/courier/CourierProfile.tsx`

**Changes:**
- Apply new color palette
- Update map styling
- Update profile cards
- Remove gourmet-themed styling

#### 2.4 Update Customer Site Components
**Files to modify:**
- `src/app/sites/[subdomain]/page.tsx`
- `src/app/sites/[subdomain]/dashboard/page.tsx`
- `src/components/site/SiteScaffold.tsx`
- `src/components/site/SiteContent.tsx`
- `src/components/site/SiteAuthShell.tsx`

**Changes:**
- Apply new color palette
- Update authentication forms
- Update dashboard cards
- Remove gourmet-themed styling

### Phase 3: Layout Updates

#### 3.1 Update Navigation Components
**Files to modify:**
- `src/components/admin/dashboard/DesktopTabsNav.tsx`
- `src/components/MobileSidebar.tsx`
- `src/components/MobileTabIndicator.tsx`

**Changes:**
- Dark background
- Active state with primary color
- Remove gourmet-themed styling

#### 3.2 Update Header Components
**Files to modify:**
- `src/components/LanguageSwitcher.tsx`
- `src/components/PWAInstallPrompt.tsx`
- `src/components/PWANetworkStatus.tsx`

**Changes:**
- Apply new color palette
- Update button styling
- Remove gourmet-themed styling

### Phase 4: Specialized Components

#### 4.1 Update Calendar Components
**Files to modify:**
- `src/components/admin/dashboard/shared/CalendarDialog.tsx`
- `src/components/admin/dashboard/shared/CalendarRangeSelector.tsx`
- `src/components/admin/dashboard/shared/CalendarDateSelector.tsx`

**Changes:**
- Dark background
- Primary color for selected dates
- Remove gourmet-themed styling
- Update button styling

#### 4.2 Update Form Components
**Files to modify:**
- `src/components/admin/ChangePasswordModal.tsx`
- `src/components/admin/InterfaceSettings.tsx`
- `src/components/admin/SetsTab.tsx`

**Changes:**
- Apply new color palette
- Update form styling
- Remove gourmet-themed styling

#### 4.3 Update AI Components
**Files to modify:**
- `src/components/ai/ChatInterface.tsx`
- `src/components/tambo/TamboAgentWidget.tsx`

**Changes:**
- Dark background
- Primary color for accents
- Remove gourmet-themed styling

### Phase 5: Testing and Refinement

#### 5.1 Test All Pages
- Admin dashboard (all tabs)
- Courier page
- Customer sites
- Authentication pages
- Settings pages

#### 5.2 Test Responsive Design
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

#### 5.3 Test Dark/Light Mode
- Ensure dark mode works correctly
- Test light mode if still supported

#### 5.4 Test Accessibility
- Keyboard navigation
- Screen reader compatibility
- Focus indicators
- Color contrast

## Migration Checklist

### Design System
- [ ] Update global CSS variables
- [ ] Update Tailwind config
- [ ] Remove gourmet-themed colors
- [ ] Add new color palette
- [ ] Update typography settings
- [ ] Update spacing scale
- [ ] Update border radius scale
- [ ] Update shadow scale

### UI Components
- [ ] Update button component
- [ ] Update card component
- [ ] Update input component
- [ ] Update table component
- [ ] Update dialog component
- [ ] Update tabs component
- [ ] Update select component
- [ ] Update checkbox component
- [ ] Update badge component
- [ ] Update alert component
- [ ] Update avatar component
- [ ] Update dropdown menu component

### Admin Dashboard
- [ ] Update AdminDashboardPage
- [ ] Update AdminsTab
- [ ] Update OrdersTab
- [ ] Update ClientsTab
- [ ] Update HistoryTab
- [ ] Update WarehouseTab
- [ ] Update FinanceTab
- [ ] Update BinTab
- [ ] Update OrdersTable
- [ ] Update HistoryTable
- [ ] Update StatsCards
- [ ] Update TodaysMenu
- [ ] Update SetsTab
- [ ] Update FeaturesTab

### Courier Page
- [ ] Update courier page
- [ ] Update CourierMap
- [ ] Update CourierProfile
- [ ] Update RouteOptimizeButton
- [ ] Update MiddleLiveMap
- [ ] Update DispatchMapPanel

### Customer Sites
- [ ] Update site pages
- [ ] Update SiteScaffold
- [ ] Update SiteContent
- [ ] Update SiteAuthShell
- [ ] Update OtpAuthForm
- [ ] Update dashboard pages
- [ ] Update history pages

### Navigation & Layout
- [ ] Update DesktopTabsNav
- [ ] Update MobileSidebar
- [ ] Update MobileTabIndicator
- [ ] Update LanguageSwitcher
- [ ] Update PWAInstallPrompt
- [ ] Update PWANetworkStatus
- [ ] Update UserGuide

### Specialized Components
- [ ] Update CalendarDialog
- [ ] Update CalendarRangeSelector
- [ ] Update CalendarDateSelector
- [ ] Update ChangePasswordModal
- [ ] Update InterfaceSettings
- [ ] Update ChatInterface
- [ ] Update TamboAgentWidget
- [ ] Update SiteBuilderCard
- [ ] Update SiteStyleRendersDialog

### Testing
- [ ] Test all admin dashboard tabs
- [ ] Test courier page
- [ ] Test customer sites
- [ ] Test authentication flows
- [ ] Test responsive design
- [ ] Test dark/light mode
- [ ] Test accessibility
- [ ] Fix any bugs or issues

## Notes

### Breaking Changes
- All gourmet-themed colors will be removed
- Custom color classes (gourmet-green, gourmet-cream, etc.) will no longer work
- Some component props may need to be updated
- Custom styling may need to be refactored

### Migration Strategy
1. Start with design system foundation (CSS variables, Tailwind config)
2. Update UI components first (buttons, cards, inputs, etc.)
3. Update admin dashboard components
4. Update other pages (courier, customer sites)
5. Test thoroughly
6. Fix any issues

### Rollback Plan
Keep a backup of the current design system files:
- `src/app/globals.css`
- `tailwind.config.ts`
- All component files before modification

This allows for quick rollback if needed.
