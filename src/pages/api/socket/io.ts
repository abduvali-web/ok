import { Server as IOServer } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import jwt from 'jsonwebtoken'

interface SocketServer extends HTTPServer {
    io?: IOServer
}

interface SocketWithIO extends NetSocket {
    server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
    socket: SocketWithIO
}

const JWT_SECRET = process.env.JWT_SECRET!

export const config = {
    api: {
        bodyParser: false
    }
}

interface ChatMessage {
    id: string
    senderName: string
    senderRole: 'CUSTOMER' | 'SITE_ADMIN'
    content: string
    timestamp: Date
}

type CustomerTokenPayload = {
    id: string
    role: 'CUSTOMER'
    phone?: string
    websiteId?: string
    subdomain?: string
}

type SiteAdminTokenPayload = {
    id: string
    role: 'SITE_ADMIN'
    name: string
    websiteId: string
}

type SocketAuthPayload = CustomerTokenPayload | SiteAdminTokenPayload

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (res.socket.server.io) {
        res.end()
        return
    }

    const io = new IOServer(res.socket.server as any, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error('Authentication required'))
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as SocketAuthPayload

            if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'string') {
                return next(new Error('Invalid token payload'))
            }

            if (decoded.role !== 'CUSTOMER' && decoded.role !== 'SITE_ADMIN') {
                return next(new Error('Invalid token role'))
            }

            socket.data.participantId = decoded.id
            socket.data.role = decoded.role
            socket.data.websiteId = decoded.websiteId || null
            socket.data.displayName = decoded.role === 'SITE_ADMIN'
                ? decoded.name || 'Middle Admin'
                : `Client ${decoded.id.slice(-4)}`

            next()
        } catch {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket) => {
        socket.on('join_room', (websiteId: string) => {
            if (!websiteId || typeof websiteId !== 'string') return

            const allowedWebsiteId = socket.data.websiteId as string | null
            if (allowedWebsiteId && allowedWebsiteId !== websiteId) {
                socket.emit('chat_error', { error: 'Room access denied' })
                return
            }

            socket.join(`website:${websiteId}`)
        })

        socket.on('chat_message', (data: { websiteId: string; senderName?: string; content: string }) => {
            const content = typeof data?.content === 'string' ? data.content.trim() : ''
            if (!content) return
            if (content.length > 2000) return

            const websiteId = typeof data?.websiteId === 'string' ? data.websiteId : ''
            if (!websiteId) return

            const allowedWebsiteId = socket.data.websiteId as string | null
            if (allowedWebsiteId && allowedWebsiteId !== websiteId) {
                socket.emit('chat_error', { error: 'Room access denied' })
                return
            }

            const role = socket.data.role as 'CUSTOMER' | 'SITE_ADMIN'
            const participantId = socket.data.participantId as string
            const fallbackName = socket.data.displayName as string

            const message: ChatMessage = {
                id: `${Date.now()}-${participantId}`,
                senderName: fallbackName || data.senderName || 'User',
                senderRole: role,
                content,
                timestamp: new Date()
            }

            io.to(`website:${websiteId}`).emit('new_message', message)
        })
    })

    res.socket.server.io = io
    res.end()
}
