'use client'

import { useCallback, useMemo, useState } from 'react'
import { Bot, Palette, Users } from 'lucide-react'

import { ChatTab } from '@/components/chat/ChatTab'
import { TamboAgentWidget } from '@/components/tambo/TamboAgentWidget'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

type Mode = 'team' | 'ai'
type AgentPreset = 'ops' | 'design'

function openTamboWithPrompt(prompt: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('tambo:open-chat', { detail: { prompt } }))
}

export function ChatCenter() {
  const { t } = useLanguage()
  const ui = (t as any)
  const [mode, setMode] = useState<Mode>('team')
  const [agentPreset, setAgentPreset] = useState<AgentPreset>('ops')

  const agentPrompt = useMemo(() => {
    if (agentPreset === 'design') {
      return (
        'Act as a design + UX agent. Improve layouts, spacing, typography, and interaction. ' +
        'Prefer clean admin UI with consistent icon-only actions and audit-friendly tables.'
      )
    }
    return (
      'Act as an operations + audit agent. Help with audit periods (day/week/month), explain anomalies, ' +
      'and propose clear tables/exports for managers.'
    )
  }, [agentPreset])

  const handleSelectAgent = useCallback((preset: AgentPreset) => {
    setAgentPreset(preset)
    setMode('ai')
    const prompt =
      preset === 'design'
        ? 'Act as a design + UX agent. Improve layouts, spacing, typography, and interaction. Prefer clean admin UI with consistent icon-only actions and audit-friendly tables.'
        : 'Act as an operations + audit agent. Help with audit periods (day/week/month), explain anomalies, and propose clear tables/exports for managers.'
    openTamboWithPrompt(prompt)
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <IconButton
            label={ui?.common?.chat ?? 'Chat'}
            variant={mode === 'team' ? 'default' : 'outline'}
            onClick={() => setMode('team')}
          >
            <Users className="size-4" />
          </IconButton>
          <IconButton
            label={ui?.common?.ai ?? 'AI'}
            variant={mode === 'ai' ? 'default' : 'outline'}
            onClick={() => {
              setMode('ai')
              openTamboWithPrompt(agentPrompt)
            }}
          >
            <Bot className="size-4" />
          </IconButton>
        </div>

        {mode === 'ai' ? (
          <div className="flex items-center gap-2">
            <IconButton
              label={ui?.common?.operations ?? 'Operations'}
              variant={agentPreset === 'ops' ? 'default' : 'outline'}
              onClick={() => handleSelectAgent('ops')}
            >
              <Bot className="size-4" />
            </IconButton>
            <IconButton
              label={ui?.common?.design ?? 'Design'}
              variant={agentPreset === 'design' ? 'default' : 'outline'}
              onClick={() => handleSelectAgent('design')}
            >
              <Palette className="size-4" />
            </IconButton>
          </div>
        ) : null}
      </div>

      <div className={cn('min-h-0 flex-1', mode === 'team' ? 'p-4' : 'p-0')}>
        {mode === 'team' ? <ChatTab /> : <TamboAgentWidget embedded />}
      </div>
    </div>
  )
}
