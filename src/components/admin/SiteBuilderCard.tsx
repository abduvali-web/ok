'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Globe, Loader2, Palette, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteStyleRendersDialog } from '@/components/admin/SiteStyleRendersDialog'
import {
  DEFAULT_STYLE_VARIANT,
  SITE_RENDER_PAGES,
  SITE_STYLE_PRESETS,
  normalizeSubdomain,
  type SiteStyleVariant,
} from '@/lib/site-builder'

type WebsiteSettingsResponse = {
  website: {
    id: string | null
    subdomain: string
    siteName: string
    styleVariant: SiteStyleVariant
  }
  baseHost: string
}

export function SiteBuilderCard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [baseHost, setBaseHost] = useState('localhost:3000')

  const [siteName, setSiteName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [styleVariant, setStyleVariant] = useState<SiteStyleVariant>(DEFAULT_STYLE_VARIANT)
  const [previewPresetId, setPreviewPresetId] = useState<SiteStyleVariant | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const normalizedSubdomain = useMemo(() => normalizeSubdomain(subdomain), [subdomain])
  const previewPreset = useMemo(
    () => SITE_STYLE_PRESETS.find((preset) => preset.id === previewPresetId) ?? null,
    [previewPresetId]
  )

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/website')
        if (!response.ok) {
          throw new Error('Failed to load website settings')
        }

        const data = (await response.json()) as WebsiteSettingsResponse
        setSiteName(data.website.siteName || '')
        setSubdomain(data.website.subdomain || '')
        setStyleVariant(data.website.styleVariant || DEFAULT_STYLE_VARIANT)
        setBaseHost(data.baseHost || 'localhost:3000')
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : 'Failed to load website settings')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleSave = async () => {
    if (!siteName.trim()) {
      toast.error('Site name is required')
      return
    }

    if (!normalizedSubdomain) {
      toast.error('Subdomain is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName.trim(),
          subdomain: normalizedSubdomain,
          styleVariant,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save website settings')
      }

      setSubdomain(normalizedSubdomain)
      toast.success('Website settings saved')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to save website settings')
    } finally {
      setIsSaving(false)
    }
  }

  const styleCards = SITE_STYLE_PRESETS.map((preset) => {
    const selected = preset.id === styleVariant

    return (
      <div
        key={preset.id}
        onClick={() => setStyleVariant(preset.id)}
        className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setStyleVariant(preset.id)
        }}
      >
        <div
          className="rounded-lg border p-2"
          style={{
            background: `linear-gradient(140deg, ${preset.palette.heroFrom}, ${preset.palette.heroTo})`,
            borderColor: preset.palette.border,
          }}
        >
          <div className="mb-2 flex items-center justify-between text-xs" style={{ color: preset.palette.heroText }}>
            <span className="font-semibold">{preset.title}</span>
            <span>{selected ? 'Selected' : 'Preview'}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {SITE_RENDER_PAGES.map((page) => (
              <div
                key={page.id}
                className="rounded border p-1"
                style={{
                  backgroundColor: preset.palette.panelBackground,
                  borderColor: preset.palette.border,
                  color: preset.palette.textPrimary,
                }}
              >
                <div className="mb-1 h-1.5 rounded" style={{ backgroundColor: preset.palette.accent }} />
                <div className="truncate text-[9px]">{page.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{preset.description}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setPreviewPresetId(preset.id)
              setPreviewOpen(true)
            }}
          >
            <Eye className="h-4 w-4" /> Renders
          </Button>
        </div>
      </div>
    )
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Website Builder</CardTitle>
          <CardDescription>Loading website settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Please wait
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4" /> Website Builder
        </CardTitle>
        <CardDescription>
          Choose subdomain, brand name, and one of 4 style variants. Each style previews 5 pages.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <SiteStyleRendersDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          preset={previewPreset}
          siteName={siteName.trim() || 'Company'}
          subdomain={normalizedSubdomain || 'your-subdomain'}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Healthy Meals"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="healthy-meals"
            />
            <p className="text-xs text-muted-foreground">Path URL: `/sites/{normalizedSubdomain || 'your-subdomain'}`</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Style Variant</p>
          <div className="grid gap-3 md:grid-cols-2">{styleCards}</div>
        </div>

        <div className="rounded-lg border border-dashed border-border p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Globe className="h-4 w-4" /> URLs
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div>Path: `/sites/{normalizedSubdomain || 'your-subdomain'}`</div>
            <div>Host: `https://{normalizedSubdomain || 'your-subdomain'}.{baseHost}`</div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Site Settings
        </Button>
      </CardContent>
    </Card>
  )
}
