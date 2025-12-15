import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'

// Types for Dish
interface DishInput {
    id?: string
    name: string
    description?: string
    mealType: string
    ingredients: { name: string; amount: number; unit: string }[]
    imageUrl?: string
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['SUPER_ADMIN', 'MIDDLE_ADMIN'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const dishes = await db.dish.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(dishes)
    } catch (error) {
        console.error('Error fetching dishes:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['SUPER_ADMIN', 'MIDDLE_ADMIN'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body: DishInput = await request.json()
        const { name, description, mealType, ingredients, imageUrl } = body

        if (!name || !mealType) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 })
        }

        const dish = await db.dish.create({
            data: {
                name,
                description,
                mealType,
                ingredients: ingredients || [], // Store as JSON
                imageUrl
            }
        })

        return NextResponse.json(dish)
    } catch (error) {
        console.error('Error creating dish:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['SUPER_ADMIN', 'MIDDLE_ADMIN'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body: DishInput = await request.json()
        const { id, name, description, mealType, ingredients, imageUrl } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        const dish = await db.dish.update({
            where: { id },
            data: {
                name,
                description,
                mealType,
                ingredients: ingredients || [],
                imageUrl
            }
        })

        return NextResponse.json(dish)
    } catch (error) {
        console.error('Error updating dish:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['SUPER_ADMIN', 'MIDDLE_ADMIN'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        await db.dish.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting dish:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
