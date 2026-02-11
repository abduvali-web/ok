import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { type AdminRole, isAdminRole, ADMIN_ROLE_LEVEL } from '@/lib/roles'

const JWT_SECRET = process.env.JWT_SECRET

export interface AuthUser {
    id: string
    email: string
    role: AdminRole
}

const adminJwtPayloadSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  role: z.string().min(1),
})

/**
 * Unified authentication helper that supports both NextAuth sessions and JWT tokens
 * Checks NextAuth session first, falls back to JWT token from Authorization header
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
    // Try NextAuth session first
    try {
        const session = await auth(request as any)
        if (session?.user) {
            if (!isAdminRole(session.user.role)) return null
            return {
                id: session.user.id,
                email: session.user.email!,
                role: session.user.role
            }
        }
    } catch {
        // NextAuth not available in this context, continue to JWT
    }

    // Fall back to JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    try {
        if (!JWT_SECRET) return null
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
        const parsed = adminJwtPayloadSchema.safeParse(decoded)
        if (!parsed.success) return null
        if (!isAdminRole(parsed.data.role)) return null
        return {
            id: parsed.data.id,
            email: parsed.data.email,
            role: parsed.data.role
        }
    } catch {
        return null
    }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, allowedRoles: readonly AdminRole[]): boolean
export function hasRole(user: AuthUser, allowedRoles: readonly string[]): boolean
export function hasRole(user: AuthUser, allowedRoles: readonly string[]): boolean {
    return allowedRoles.includes(user.role)
}

/**
 * Check if user can modify target admin (role hierarchy)
 */
export function canModifyAdmin(user: AuthUser, targetRole: AdminRole | string): boolean {
    const target = isAdminRole(targetRole) ? targetRole : null
    const userLevel = ADMIN_ROLE_LEVEL[user.role] ?? 0
    const targetLevel = target ? (ADMIN_ROLE_LEVEL[target] ?? 0) : 0
    return userLevel > targetLevel
}
