'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    getTodaysMenuNumber,
    getTodaysMenu,
    getDishImageUrl,
    MEAL_TYPES,
    type DailyMenu,
    type Dish
} from '@/lib/menuData';
import { Calendar, Utensils } from 'lucide-react';

interface TodaysMenuProps {
    className?: string;
}

const mealTypeColors: Record<keyof typeof MEAL_TYPES, string> = {
    BREAKFAST: 'bg-amber-100 text-amber-800 border-amber-200',
    SECOND_BREAKFAST: 'bg-orange-100 text-orange-800 border-orange-200',
    LUNCH: 'bg-green-100 text-green-800 border-green-200',
    SNACK: 'bg-purple-100 text-purple-800 border-purple-200',
    DINNER: 'bg-blue-100 text-blue-800 border-blue-200',
    SIXTH_MEAL: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const mealTypeIcons: Record<keyof typeof MEAL_TYPES, string> = {
    BREAKFAST: '🌅',
    SECOND_BREAKFAST: '🥐',
    LUNCH: '🍽️',
    SNACK: '🍎',
    DINNER: '🌙',
    SIXTH_MEAL: '🥗',
};

export function TodaysMenu({ className }: TodaysMenuProps) {
    const [menu, setMenu] = useState<DailyMenu | undefined>(undefined);
    const [menuNumber, setMenuNumber] = useState<number>(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    useEffect(() => {
        const currentMenuNumber = getTodaysMenuNumber();
        setMenuNumber(currentMenuNumber);
        setMenu(getTodaysMenu());
    }, []);

    const handleImageError = (dishId: number) => {
        setImageErrors(prev => new Set(prev).add(dishId));
    };

    if (!menu) {
        return (
            <Card className={`glass-card border-none ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        Сегодняшнее меню
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group dishes by meal type
    const dishesByMealType = menu.dishes.reduce((acc, dish) => {
        if (!acc[dish.mealType]) {
            acc[dish.mealType] = [];
        }
        acc[dish.mealType].push(dish);
        return acc;
    }, {} as Record<keyof typeof MEAL_TYPES, Dish[]>);

    return (
        <Card className={`glass-card border-none ${className}`}>
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Utensils className="w-5 h-5 text-primary" />
                            Сегодняшнее меню
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Блюда для доставки сегодня
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 bg-primary/5">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">День {menuNumber}</span>
                        <span className="text-muted-foreground">из 21</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(MEAL_TYPES).map(([key, label]) => {
                        const mealKey = key as keyof typeof MEAL_TYPES;
                        const dishes = dishesByMealType[mealKey];

                        if (!dishes || dishes.length === 0) return null;

                        return (
                            <div key={key} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{mealTypeIcons[mealKey]}</span>
                                    <Badge
                                        variant="outline"
                                        className={`${mealTypeColors[mealKey]} font-medium`}
                                    >
                                        {label}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {dishes.map((dish) => (
                                        <div
                                            key={dish.id}
                                            className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                                                {!imageErrors.has(dish.id) ? (
                                                    <img
                                                        src={getDishImageUrl(dish.id)}
                                                        alt={dish.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={() => handleImageError(dish.id)}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-100 to-slate-200">
                                                        {mealTypeIcons[dish.mealType]}
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-black/60 text-white text-xs backdrop-blur-sm border-0">
                                                        #{dish.id}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-medium text-sm text-slate-900 line-clamp-2 min-h-[2.5rem]">
                                                    {dish.name}
                                                </h4>
                                                <div className="mt-2 space-y-1">
                                                    {dish.ingredients.slice(0, 3).map((ing, idx) => (
                                                        <div key={idx} className="text-xs text-slate-500 truncate">
                                                            • {ing.name}: {ing.amount} {ing.unit}
                                                        </div>
                                                    ))}
                                                    {dish.ingredients.length > 3 && (
                                                        <div className="text-xs text-slate-400">
                                                            +{dish.ingredients.length - 3} ингредиентов
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
