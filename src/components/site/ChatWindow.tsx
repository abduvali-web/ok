'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
    id: string
    senderName: string
    senderRole?: 'CUSTOMER' | 'SITE_ADMIN'
    content: string
    timestamp: Date
}

interface ChatWindowProps {
    websiteId: string
    customerName: string
    authToken?: string
    mode?: 'floating' | 'embedded'
    className?: string
}

export function ChatWindow({ websiteId, customerName, authToken, mode = 'floating', className }: ChatWindowProps) {
    const [isOpen, setIsOpen] = useState(mode === 'embedded')
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isConnecting, setIsConnecting] = useState(true)
    const socketRef = useRef<Socket | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const token = authToken || localStorage.getItem('customerToken')
        setIsConnecting(true)

        const socket = io({
            path: '/api/socket/io',
            auth: token ? { token } : {}
        })

        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnecting(false)
            socket.emit('join_room', websiteId)
        })

        socket.on('new_message', (message: ChatMessage) => {
            setMessages((prev) => [...prev, message])
        })

        socket.on('chat_error', (payload: { error?: string }) => {
            console.error('Chat room error:', payload?.error)
        })

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message)
            setIsConnecting(false)
        })

        return () => {
            socket.disconnect()
        }
    }, [websiteId, authToken])

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        if (mode === 'embedded') {
            setIsOpen(true)
        }
    }, [mode])

    const sendMessage = () => {
        if (!input.trim() || !socketRef.current) return

        socketRef.current.emit('chat_message', {
            websiteId,
            content: input.trim()
        })

        setInput('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (mode === 'floating' && !isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
            >
                <MessageCircle className="w-6 h-6" />
            </Button>
        )
    }

    return (
        <Card
            className={cn(
                mode === 'floating'
                    ? 'fixed bottom-6 right-6 w-[22rem] h-[500px] shadow-2xl flex flex-col z-50'
                    : 'w-full h-full min-h-[300px] flex flex-col',
                className
            )}
        >
            <CardHeader className="py-3 px-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Community Chat
                    </CardTitle>
                    {mode === 'floating' && (
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                {isConnecting ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <ScrollArea
                            className="flex-1 p-4"
                            ref={scrollContainerRef as any}
                        >
                            {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => {
                                        const ownMessage = msg.senderName === customerName
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    'p-2 rounded-lg',
                                                    ownMessage
                                                        ? 'bg-primary text-primary-foreground ml-8'
                                                        : 'bg-muted mr-8'
                                                )}
                                            >
                                                <div className="text-xs font-medium mb-1 opacity-75 flex items-center gap-1">
                                                    <span>{msg.senderName}</span>
                                                    {msg.senderRole === 'SITE_ADMIN' && <span>(admin)</span>}
                                                </div>
                                                <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-3 border-t flex gap-2 flex-shrink-0">
                            <Input
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
