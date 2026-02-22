import { NextResponse, type NextRequest } from 'next/server'
import { auth } from './auth'
import { RESERVED_SUBDOMAINS, normalizeSubdomain } from '@/lib/site-builder'

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').split(':')[0].toLowerCase()

function extractSubdomain(hostHeader: string | null) {
    if (!hostHeader) return null

    const hostWithoutPort = hostHeader.split(':')[0].toLowerCase()

    if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
        return null
    }

    if (ROOT_DOMAIN && hostWithoutPort === ROOT_DOMAIN) {
        return null
    }

    if (ROOT_DOMAIN && hostWithoutPort.endsWith(`.${ROOT_DOMAIN}`)) {
        const suffix = `.${ROOT_DOMAIN}`
        const prefix = hostWithoutPort.slice(0, -suffix.length)
        return prefix || null
    }

    if (hostWithoutPort.endsWith('.localhost')) {
        return hostWithoutPort.replace(/\.localhost$/, '') || null
    }

    return null
}

function shouldSkipPath(pathname: string) {
    return (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname.startsWith('/sites/')
    )
}

export default auth((request: NextRequest) => {
    const { nextUrl } = request

    if (shouldSkipPath(nextUrl.pathname)) {
        return NextResponse.next()
    }

    const rawSubdomain = extractSubdomain(request.headers.get('host'))
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
