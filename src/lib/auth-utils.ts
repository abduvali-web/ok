import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { type AdminRole, isAdminRole, ADMIN_ROLE_LEVEL } from '@/lib/roles'
import { db } from '@/lib/db'
import { safeJsonParse } from '@/lib/safe-json'

const JWT_SECRET = process.env.JWT_SECRET

export interface AuthUser {
    id: string
    email: string
    role: AdminRole
    allowedTabs: string[] | null
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
    let baseUser: { id: string; role: AdminRole; email: string } | null = null

    // Try NextAuth session first
    try {
        const session = await auth(request as any)
        if (session?.user && isAdminRole(session.user.role)) {
            baseUser = {
                id: session.user.id,
                email: session.user.email!,
                role: session.user.role
            }
        }
    } catch {
        // NextAuth not available in this context, continue to JWT
    }

    if (!baseUser) {
        // Fall back to JWT token
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            try {
                if (JWT_SECRET) {
                    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
                    const parsed = adminJwtPayloadSchema.safeParse(decoded)
                    if (parsed.success && isAdminRole(parsed.data.role)) {
                        baseUser = {
                            id: parsed.data.id,
                            email: parsed.data.email,
                            role: parsed.data.role as AdminRole
                        }
                    }
                }
            } catch {
                // Invalid token
            }
        }
    }

    if (!baseUser) return null

    try {
        // Fetch up-to-date allowedTabs and verify user exists/active
        const user = await db.admin.findUnique({
            where: { id: baseUser.id },
            select: { allowedTabs: true, role: true, isActive: true }
        })

        if (!user || (baseUser.role !== 'SUPER_ADMIN' && !user.isActive)) return null

        // Parse allowedTabs
        const allowedTabs = (() => {
            const parsed = safeJsonParse<unknown>(user.allowedTabs, [])
            return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : []
        })()

        return {
            ...baseUser,
            // Override role from DB in case it changed
            role: user.role as AdminRole,
            allowedTabs: user.allowedTabs ? allowedTabs : null
        }
    } catch (error) {
        console.error('Error fetching user details:', error)
        // Fallback to token info if DB fails but return null to be safe?
        // Better to fail safe.
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
 * Check if user has permission to access a specific tab/feature
 * Only applies to LOW_ADMIN, others have full access (except COURIER/WORKER who have none)
 */
export function hasPermission(user: AuthUser, tab: string): boolean {
    if (user.role === 'SUPER_ADMIN' || user.role === 'MIDDLE_ADMIN') return true
    if (user.role !== 'LOW_ADMIN') return false // COURIER/WORKER don't have tab access usually

    // If allowedTabs is null (not set), LOW_ADMIN has access to everything by default?
    // Or nothing?
    // Based on previous logic: if (user.allowedTabs == null) -> all tabs.
    // But `getAuthUser` converts null to null.
    // Wait, in `AdminDashboardPage` logic:
    // `deriveVisibleTabs(null)` -> ALL TABS.

    // So if allowedTabs is null, return true.
    if (user.allowedTabs === null) return true

    // Check aliases
    let target = tab
    if (target === 'chat') target = 'profile'
    if (target === 'settings') target = 'interface'

    return user.allowedTabs.includes(target)
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
