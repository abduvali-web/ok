import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCustomerToken } from '@/lib/customer-auth'
import { getSiteBySubdomain, getSiteGroupAdminIds } from '@/lib/site-access'

function normalizePhone(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const digits = trimmed.startsWith('+') ? trimmed.slice(1).replace(/\D/g, '') : trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return `+${digits}`
}

function cookieDomainFromRootHost(rootHost: string | undefined) {
  if (!rootHost) return undefined
  const host = rootHost.split(':')[0].trim().toLowerCase()
  if (!host || host === 'localhost') return undefined
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return undefined
  return `.${host}`
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await context.params
    const site = await getSiteBySubdomain(subdomain)

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '')

    if (!phone || phone.length < 10 || phone.length > 16) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    const groupAdminIds = await getSiteGroupAdminIds(site.adminId)

    // Prefer owner-admin customer record if duplicates exist across the group.
    let customer = await db.customer.findFirst({
      where: {
        phone,
        deletedAt: null,
        createdBy: site.adminId,
      },
    })

    if (!customer) {
      customer = await db.customer.findFirst({
        where: {
          phone,
          deletedAt: null,
          createdBy: { in: groupAdminIds },
        },
      })
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found for this site' }, { status: 404 })
    }

    if (!customer.isActive) {
      return NextResponse.json({ error: 'Customer account is inactive' }, { status: 403 })
    }

    const token = createCustomerToken({
      id: customer.id,
      phone: customer.phone,
      websiteId: site.id,
      ownerAdminId: site.adminId,
      subdomain: site.subdomain,
    })

    const response = NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        balance: customer.balance,
      },
    })

    response.cookies.set({
      name: 'customerToken',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      domain: cookieDomainFromRootHost(process.env.NEXT_PUBLIC_ROOT_DOMAIN),
    })

    return response
  } catch (error) {
    console.error('Error logging in customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

