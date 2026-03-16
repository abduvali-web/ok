'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, MessageSquarePlus, Send, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { SearchPanel } from '@/components/ui/search-panel'
import { cn } from '@/lib/utils'
import { getJsonFromLocalStorage } from '@/lib/browser-storage'
import { TamboAgentWidget } from '@/components/tambo/TamboAgentWidget'
import { useLanguage } from '@/contexts/LanguageContext'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

interface Conversation {
  id: string
  otherParticipant: User
  lastMessage: {
    content: string
    createdAt: string
    isRead: boolean
    senderId: string
  } | null
  unreadCount: number
}

type SelectedThread =
  | { kind: 'conversation'; conversationId: string }
  | { kind: 'ai'; agent: User }
  | null

function getStoredUserId() {
  if (typeof window === 'undefined') return null
  const user = getJsonFromLocalStorage<{ id?: string }>('user')
  if (!user || typeof user.id !== 'string') return null
  return user.id
}

function openTamboWithPrompt(prompt: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('tambo:open-chat', { detail: { prompt, newThread: true } }))
}

function buildAdminAgentPrompt(agent: User) {
  // Keep this short; the Tambo system prompt already enforces tool-based responses.
  return (
    `Act as an AI agent representing admin "${agent.name}" (${agent.role}). ` +
    'Focus on operations, audit periods (day/week/month), and manager-friendly explanations. ' +
    'Be concise and propose tables/filters when helpful.'
  )
}

export function ChatUnifiedTab() {
  const { t } = useLanguage()
  const ui = (t as any)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedThread, setSelectedThread] = useState<SelectedThread>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showUserList, setShowUserList] = useState(false)
  const [isBootLoading, setIsBootLoading] = useState(true)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentUserId = useMemo(() => getStoredUserId(), [])

  const selectedConversationId =
    selectedThread?.kind === 'conversation' ? selectedThread.conversationId : null
  const selectedAiAgent = selectedThread?.kind === 'ai' ? selectedThread.agent : null

  useEffect(() => {
    const load = async () => {
      setIsBootLoading(true)
      await Promise.all([fetchConversations(), fetchAvailableUsers()])
      setIsBootLoading(false)
    }

    void load()

    const interval = setInterval(() => {
      void fetchConversations()
      if (selectedConversationId) {
        void fetchMessages(selectedConversationId, true)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter(
      (conversation) =>
        conversation.otherParticipant.name.toLowerCase().includes(query) ||
        conversation.otherParticipant.email.toLowerCase().includes(query)
    )
  }, [conversations, search])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return availableUsers
    return availableUsers.filter(
      (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    )
  }, [availableUsers, search])

  const selectedConversationData = useMemo(() => {
    if (!selectedConversationId) return null
    return conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
  }, [conversations, selectedConversationId])

  async function fetchConversations() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch {
      // ignore transient polling errors
    }
  }

  async function fetchAvailableUsers() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/users', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users)
      }
    } catch {
      // ignore transient loading errors
    }
  }

  async function fetchMessages(conversationId: string, silent = false) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Unable to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages)

      await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId }),
      })
    } catch {
      if (!silent) toast.error(ui?.common?.couldNotLoadMessages ?? 'Could not load messages')
    }
  }

  async function startConversation(userId: string) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: userId }),
      })

      if (!response.ok) {
        throw new Error('Could not start conversation')
      }

      const data = await response.json()
      setSelectedThread({ kind: 'conversation', conversationId: data.conversation.id })
      setShowUserList(false)
      await fetchConversations()
      await fetchMessages(data.conversation.id)
    } catch {
      toast.error(ui?.common?.couldNotStartConversation ?? 'Could not start conversation')
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversationId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Could not send message')
      }

      setNewMessage('')
      await fetchMessages(selectedConversationId)
      await fetchConversations()
    } catch {
      toast.error(ui?.common?.couldNotSendMessage ?? 'Could not send message')
    }
  }

  function selectConversation(conversationId: string) {
    setSelectedThread({ kind: 'conversation', conversationId })
    void fetchMessages(conversationId)
  }

  function selectAiAgent(agent: User) {
    setSelectedThread({ kind: 'ai', agent })
    setShowUserList(false)
    openTamboWithPrompt(buildAdminAgentPrompt(agent))
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-violet-100 text-violet-800'
      case 'MIDDLE_ADMIN':
        return 'bg-sky-100 text-sky-800'
      case 'LOW_ADMIN':
        return 'bg-emerald-100 text-emerald-800'
      case 'COURIER':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return ui?.roles?.superAdmin ?? 'Super Admin'
      case 'MIDDLE_ADMIN':
        return ui?.roles?.middleAdmin ?? 'Middle Admin'
      case 'LOW_ADMIN':
        return ui?.roles?.lowAdmin ?? 'Low Admin'
      case 'COURIER':
        return ui?.roles?.courier ?? 'Courier'
      default:
        return role
    }
  }

  const aiConversationLabel = selectedAiAgent ? `${selectedAiAgent.name} (AI)` : null

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 p-4 xl:grid-cols-[360px_1fr]">
      <Card className="glass-card min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {ui?.chat?.title ?? 'Chat'}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {ui?.chat?.subtitle ?? 'Direct team chat + AI agents in one place.'}
              </p>
            </div>

            <IconButton
              label={ui?.chat?.newConversation ?? 'New conversation'}
              variant="outline"
              onClick={() => setShowUserList((prev) => !prev)}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="mt-3">
            <SearchPanel
              value={search}
              onChange={setSearch}
              placeholder={
                showUserList
                  ? ui?.chat?.searchUsers ?? 'Search users'
                  : ui?.chat?.searchConversations ?? 'Search conversations'
              }
              className="max-w-none"
            />
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {isBootLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-sm text-muted-foreground">{ui?.common?.loading ?? 'Loading...'}</div>
            </div>
          ) : showUserList ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {ui?.chat?.noUsers ?? 'No users available.'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => void startConversation(user.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:text-foreground"
                    >
                      <Avatar>
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    <Badge className={cn(getRoleColor(user.role), 'shrink-0 max-w-[140px] truncate')}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </button>

                  <IconButton
                    label={(ui?.common?.ai ?? 'AI') + ' ' + user.name}
                    variant="outline"
                    className="shrink-0"
                    onClick={() => selectAiAgent(user)}
                  >
                    <Bot className="h-4 w-4" />
                  </IconButton>
                </div>
                ))
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {aiConversationLabel ? (
                <button
                  type="button"
                  onClick={() => selectAiAgent(selectedAiAgent!)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                    selectedThread?.kind === 'ai' ? 'bg-muted/50' : ''
                  )}
                >
                  <Avatar>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{aiConversationLabel}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {ui?.chat?.aiHint ?? 'AI agent via Tambo'}
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100">
                    {ui?.common?.ai ?? 'AI'}
                  </Badge>
                </button>
              ) : null}

              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {ui?.chat?.noConversations ?? 'No conversations yet.'}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                      selectedConversationId === conversation.id ? 'bg-muted/50' : ''
                    )}
                  >
                    <Avatar>
                      <AvatarFallback>{conversation.otherParticipant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{conversation.otherParticipant.name}</span>
                        {conversation.unreadCount > 0 ? (
                          <Badge className="bg-rose-500 text-white">{conversation.unreadCount}</Badge>
                        ) : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {conversation.lastMessage?.content || (ui?.chat?.noMessagesYet ?? 'No messages yet.')}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={cn(
          'glass-card min-h-0 overflow-hidden',
          selectedAiAgent ? 'gap-0 py-0' : ''
        )}
      >
        {selectedAiAgent ? (
          <CardContent className="h-full min-h-0 px-0">
            <TamboAgentWidget embedded />
          </CardContent>
        ) : selectedConversationId ? (
          <>
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedConversationData?.otherParticipant.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">{selectedConversationData?.otherParticipant.name}</CardTitle>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedConversationData?.otherParticipant.email}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex h-full min-h-0 flex-col p-4">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', message.senderId === currentUserId ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[78%] rounded-2xl px-4 py-3',
                        message.senderId === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <div className="text-sm leading-6">{message.content}</div>
                      <div className="mt-1 text-[11px] opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
                <Input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void sendMessage()
                    }
                  }}
                  placeholder={ui?.chat?.writeMessage ?? 'Write a message...'}
                  className="flex-1"
                />
                <Button onClick={() => void sendMessage()} disabled={!newMessage.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex h-full min-h-[640px] items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">{ui?.chat?.selectConversation ?? 'Select a conversation'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {ui?.chat?.selectConversationHint ??
                  'Choose a thread or start a new one (you can also open an AI agent from the user list).'}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
