export const CANONICAL_TABS = [
  'orders',
  'clients',
  'admins',
  'features',
  'bin',
  'statistics',
  'history',
  'profile',
  'warehouse',
  'finance',
  'interface',
] as const

export type CanonicalTabId = (typeof CANONICAL_TABS)[number]

export function mapLegacyAllowedTabId(tab: string): string {
  if (tab === 'chat') return 'profile'
  if (tab === 'settings') return 'interface'
  return tab
}

export function deriveVisibleTabs(allowedTabs: string[] | null | undefined): string[] {
  const canonical = new Set<string>(CANONICAL_TABS as unknown as string[])
  const normalized = (allowedTabs || []).map(mapLegacyAllowedTabId).filter((tab) => canonical.has(tab))

  return normalized.length > 0 ? normalized : [...(CANONICAL_TABS as unknown as string[])]
}
