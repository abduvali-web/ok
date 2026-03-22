'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ChatCenter } from '@/components/chat/ChatCenter'

export function ChatSheet({
  open,
  onOpenChange,
  title = 'Chat',
  description = 'Conversations and AI assistant',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[980px] p-0">
        <div className="h-full min-h-0 flex flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-4">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 p-4 overflow-hidden">
            <ChatCenter />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

