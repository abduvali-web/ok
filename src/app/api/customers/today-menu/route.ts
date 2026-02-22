import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'
import { getMenu, getTodaysMenuNumber, getDishImageUrl } from '@/lib/menuData'
import { getOwnerAdminIdForCustomer } from '@/lib/site-access'

type SetDish = {
  dishId?: number
  dishName?: string
  mealType?: string
}

type CalorieGroup = {
  calories?: number
  dishes?: SetDish[]
}

const CALORIE_TIERS = [1200, 1600, 2000, 2500, 3000]

function closestTier(calories: number) {
  return CALORIE_TIERS.reduce((closest, current) => {
    return Math.abs(current - calories) < Math.abs(closest - calories) ? current : closest
  }, CALORIE_TIERS[0])
}

function normalizeMealType(value?: string) {
  const upper = String(value || 'UNKNOWN').toUpperCase()
  if (upper === 'BREAKFAST' || upper === 'SECOND_BREAKFAST' || upper === 'LUNCH' || upper === 'SNACK' || upper === 'DINNER' || upper === 'SIXTH_MEAL') {
    return upper
  }
  return 'UNKNOWN'
}

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request)
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const menuNumber = getTodaysMenuNumber()
    const tier = closestTier(customer.calories || 2000)

    const ownerAdminId = await getOwnerAdminIdForCustomer(customer.createdBy)

    let setName: string | null = null
    let source: 'set' | 'default' = 'default'
    let dishes: Array<{ id: number; name: string; mealType: string; imageUrl: string }> = []

    if (ownerAdminId) {
      const activeSet = await db.menuSet.findFirst({
        where: {
          adminId: ownerAdminId,
          isActive: true,
        },
        select: {
          name: true,
          calorieGroups: true,
        },
      })

      if (activeSet && activeSet.calorieGroups) {
        const groups = activeSet.calorieGroups as Record<string, CalorieGroup[]>
        const dayGroups = Array.isArray(groups?.[menuNumber.toString()]) ? groups[menuNumber.toString()] : []

        if (dayGroups.length > 0) {
          const exact = dayGroups.find((group) => group.calories === tier)
          const selectedGroup =
            exact ||
            dayGroups.reduce<CalorieGroup | null>((best, current) => {
              if (!best || typeof best.calories !== 'number') return current
              if (typeof current.calories !== 'number') return best
              return Math.abs(current.calories - tier) < Math.abs(best.calories - tier) ? current : best
            }, null)

          if (selectedGroup && Array.isArray(selectedGroup.dishes)) {
            const fallbackMenu = getMenu(menuNumber)
            const fallbackById = new Map((fallbackMenu?.dishes || []).map((dish) => [dish.id, dish]))

            dishes = selectedGroup.dishes
              .filter((dish): dish is Required<Pick<SetDish, 'dishId'>> & SetDish => typeof dish?.dishId === 'number')
              .map((dish) => {
                const fallback = fallbackById.get(dish.dishId)
                return {
                  id: dish.dishId,
                  name: dish.dishName || fallback?.name || `Dish ${dish.dishId}`,
                  mealType: normalizeMealType(dish.mealType || fallback?.mealType),
                  imageUrl: getDishImageUrl(dish.dishId),
                }
              })

            if (dishes.length > 0) {
              source = 'set'
              setName = activeSet.name
            }
          }
        }
      }
    }

    if (dishes.length === 0) {
      const fallbackMenu = getMenu(menuNumber)
      dishes = (fallbackMenu?.dishes || []).map((dish) => ({
        id: dish.id,
        name: dish.name,
        mealType: normalizeMealType(dish.mealType),
        imageUrl: getDishImageUrl(dish.id),
      }))
      source = 'default'
    }

    return NextResponse.json({
      menuNumber,
      tier,
      source,
      setName,
      dishes,
    })
  } catch (error) {
    console.error('Error fetching today menu:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
