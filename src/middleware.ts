import { NextResponse, type NextRequest } from 'next/server'
import { auth } from './auth'
import { RESERVED_SUBDOMAINS, normalizeSubdomain } from '@/lib/site-builder'
import { extractSubdomainFromHost } from '@/lib/subdomain-host'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN

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
