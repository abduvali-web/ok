'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessagesSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatWindow } from '@/components/site/ChatWindow'

type WebsiteResponse = {
  website: {
    id: string | null
    subdomain: string
    siteName: string
    chatEnabled: boolean
  }
}

export function SiteCommunityChat() {
  const [isLoading, setIsLoading] = useState(true)
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('Middle Admin')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const websiteResponse = await fetch('/api/admin/website')
        if (!websiteResponse.ok) {
          throw new Error('Unable to load website chat settings')
        }

        const websiteData = (await websiteResponse.json()) as WebsiteResponse
        if (!websiteData.website?.id) {
          setIsLoading(false)
          return
        }

        setWebsiteId(websiteData.website.id)

        const tokenResponse = await fetch('/api/admin/site-chat/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId: websiteData.website.id }),
        })

        const tokenData = await tokenResponse.json().catch(() => ({}))
        if (!tokenResponse.ok || !tokenData?.token) {
          throw new Error(tokenData?.error || 'Unable to create admin chat token')
        }

        setToken(tokenData.token)
        if (typeof tokenData.name === 'string' && tokenData.name.trim()) {
          setAdminName(tokenData.name)
        }
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : 'Unable to initialize site chat')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Site Community Chat</CardTitle>
        <CardDescription>Join the same room where your clients chat on the public subdomain pages.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
          </div>
        )}

        {!isLoading && (!websiteId || !token) && (
          <div className="text-sm text-muted-foreground">
            Create and save website settings first to enable community chat.
          </div>
        )}

        {!isLoading && websiteId && token && (
          <ChatWindow
            websiteId={websiteId}
            customerName={adminName}
            authToken={token}
            mode="embedded"
            className="h-[420px]"
          />
        )}
      </CardContent>
    </Card>
  )
}
