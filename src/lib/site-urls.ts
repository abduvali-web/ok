export function isLikelySubdomainHost(hostname: string, subdomain: string) {
  const host = hostname.split(':')[0].toLowerCase()
  const normalizedSubdomain = subdomain.trim().toLowerCase()
  if (!host || !normalizedSubdomain) return false

  // Common local dev pattern: foo.localhost
  if (host === `${normalizedSubdomain}.localhost`) return true

  // Generic: foo.example.com
  return host.startsWith(`${normalizedSubdomain}.`)
}

export function getClientSiteBasePath(subdomain: string) {
  if (typeof window === 'undefined') return `/sites/${subdomain}`
  const hostname = window.location.hostname || ''
  return isLikelySubdomainHost(hostname, subdomain) ? '' : `/sites/${subdomain}`
}

function normalizePath(pathname: string) {
  if (!pathname) return ''
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function makeClientSiteHref(subdomain: string, pathname: string) {
  const basePath = getClientSiteBasePath(subdomain)
  const normalized = normalizePath(pathname)

  if (!basePath) {
    return normalized || '/'
  }

  if (!normalized) {
    return basePath
  }

  return `${basePath}${normalized}`
}

