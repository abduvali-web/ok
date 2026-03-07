import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { generateWebsiteContent } from '@/lib/ai-site-generator'
import {
  DEFAULT_STYLE_VARIANT,
  RESERVED_SUBDOMAINS,
  buildThemePayload,
  getStylePreset,
  isValidSubdomain,
  normalizeSubdomain,
  parseSiteContent,
  parseThemePayload,
  updateSiteName,
} from '@/lib/site-builder'
import { buildSubdomainUrl } from '@/lib/subdomain-host'

function getHostBase() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
}

function buildFallbackSubdomain(adminName: string, adminId: string) {
  const namePart = normalizeSubdomain(adminName).slice(0, 18)
  const idPart = normalizeSubdomain(adminId).slice(0, 8)
  const candidate = normalizeSubdomain(`${namePart || 'site'}-${idPart || 'admin'}`)
  if (isValidSubdomain(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
    return candidate
  }
  return `site-${idPart || 'admin'}`
}

function inferStyleVariantFromPrompt(prompt: string, current: string) {
  const normalized = prompt.toLowerCase()

  if (/(terminal|neon|cyber|dashboard|lime|matrix|tech)/.test(normalized)) {
    return 'neo-terminal' as const
  }

  if (/(retro|poster|bold|orange|editorial|campaign)/.test(normalized)) {
    return 'retro-poster' as const
  }

  if (/(paper|calm|minimal|luxury|serif|editorial|clean)/.test(normalized)) {
    return 'nordic-paper' as const
  }

  if (/(organic|warm|natural|earth|soft|healthy|wellness)/.test(normalized)) {
    return 'organic-warm' as const
  }

  return getStylePreset(current).id
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    const apply = body?.apply !== false

    if (prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters.' },
        { status: 400 }
      )
    }

    const admin = await db.admin.findUnique({
      where: { id: user.id },
      select: { id: true, name: true },
    })

    const fallbackName = admin?.name?.trim() || 'My Site'

    const existing = await db.website.findUnique({
      where: { adminId: user.id },
      select: {
        id: true,
        subdomain: true,
        content: true,
        theme: true,
      },
    })

    const currentContent = parseSiteContent(existing?.content, fallbackName)
    const inferredSiteName =
      currentContent.about?.title?.en?.replace(/^About\s+/, '')?.trim() || fallbackName

    const currentVariant = parseThemePayload(existing?.theme).styleVariant || DEFAULT_STYLE_VARIANT
    const generatedContent = await generateWebsiteContent(prompt)
    const themedVariant = inferStyleVariantFromPrompt(prompt, currentVariant)

    if (!apply) {
      return NextResponse.json({
        success: true,
        applied: false,
        message: 'Generated website content preview only. Re-run with apply=true to persist changes.',
        website: {
          subdomain: existing?.subdomain || buildFallbackSubdomain(fallbackName, user.id),
          siteName: inferredSiteName,
          styleVariant: themedVariant,
        },
        content: updateSiteName(generatedContent, inferredSiteName),
      })
    }

    const subdomain =
      existing?.subdomain || buildFallbackSubdomain(fallbackName, user.id)

    if (!isValidSubdomain(subdomain) || RESERVED_SUBDOMAINS.has(subdomain)) {
      return NextResponse.json(
        { error: 'Cannot apply update because the current subdomain is invalid or reserved.' },
        { status: 400 }
      )
    }

    const updatedTheme = buildThemePayload(themedVariant)
    const updatedContent = updateSiteName(generatedContent, inferredSiteName)

    const website = await db.website.upsert({
      where: { adminId: user.id },
      create: {
        adminId: user.id,
        subdomain,
        theme: JSON.stringify(updatedTheme),
        content: JSON.stringify(updatedContent),
        chatEnabled: false,
      },
      update: {
        subdomain,
        theme: JSON.stringify(updatedTheme),
        content: JSON.stringify(updatedContent),
        chatEnabled: false,
      },
      select: {
        id: true,
        subdomain: true,
      },
    })

    return NextResponse.json({
      success: true,
      applied: true,
      message: 'Subdomain website content updated from AI prompt.',
      website: {
        id: website.id,
        subdomain: website.subdomain,
        siteName: inferredSiteName,
        styleVariant: themedVariant,
      },
      urls: {
        pathUrl: `/sites/${website.subdomain}`,
        hostUrl: buildSubdomainUrl(website.subdomain, getHostBase()),
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- route diagnostics for AI website edit failures.
    console.error('Error applying AI website edit:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subdomain is already used by another middle-admin.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

