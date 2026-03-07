import { NextResponse, type NextRequest } from 'next/server'
import { auth } from './auth'
import { RESERVED_SUBDOMAINS, normalizeSubdomain } from '@/lib/site-builder'
import { extractSubdomainFromHost } from '@/lib/subdomain-host'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN
const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  MIDDLE_ADMIN: '/middle-admin',
  LOW_ADMIN: '/low-admin',
  COURIER: '/courier',
}

function requiredRoleForPath(pathname: string): string | null {
  if (pathname.startsWith('/super-admin')) return 'SUPER_ADMIN'
  if (pathname.startsWith('/middle-admin')) return 'MIDDLE_ADMIN'
  if (pathname.startsWith('/low-admin')) return 'LOW_ADMIN'
  if (pathname.startsWith('/courier')) return 'COURIER'
  return null
}

function shouldSkipPath(pathname: string) {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/sites/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/middle-admin') ||
    pathname.startsWith('/low-admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/courier')
  )
}

export default auth((request: NextRequest) => {
  const { nextUrl } = request
  const requiredRole = requiredRoleForPath(nextUrl.pathname)
  const authUser = (request as NextRequest & { auth?: { user?: { role?: string } } }).auth?.user

  if (requiredRole) {
    if (!authUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (authUser.role !== requiredRole) {
      const fallbackPath = ROLE_HOME[authUser.role || ''] || '/login'
      return NextResponse.redirect(new URL(fallbackPath, request.url))
    }
  }

  if (shouldSkipPath(nextUrl.pathname)) {
    return NextResponse.next()
  }

  const rawSubdomain = extractSubdomainFromHost(request.headers.get('host'), ROOT_DOMAIN)
  if (!rawSubdomain) {
    return NextResponse.next()
  }

  const normalizedSubdomain = normalizeSubdomain(rawSubdomain)
  if (!normalizedSubdomain || RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
    return NextResponse.next()
  }

  const rewrittenUrl = nextUrl.clone()
  rewrittenUrl.pathname = `/sites/${normalizedSubdomain}${nextUrl.pathname === '/' ? '' : nextUrl.pathname}`

  return NextResponse.rewrite(rewrittenUrl)
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
