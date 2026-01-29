'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, ChefHat, Check, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface Dish {
    id: string | number; // Support both for compatibility
    name: string;
    description?: string;
    mealType: string;
    imageUrl?: string;
    calorieMappings?: Record<string, string[]>;
}

// Types for custom sets
interface SetDish {
    dishId: number;
    dishName: string;
    mealType: string;
}

interface CalorieGroup {
    calories: number;
    dishes: SetDish[];
}

interface MenuSet {
    id: string;
    name: string;
    menuNumber: number; // Global sets have 0 or ignored
    calorieGroups: Record<string, CalorieGroup[]>; // Changed to map day -> groups
    isActive: boolean;
}

interface CookingManagerProps {
    date: string;
    menuNumber: number;
    clientsByCalorie: Record<number, number>;
    onCook?: () => void;
}

const CALORIE_GROUPS = [1200, 1600, 2000, 2500, 3000];

export function CookingManager({ date, menuNumber, clientsByCalorie, onCook }: CookingManagerProps) {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [cookingPlan, setCookingPlan] = useState<any>(null); // { cookedStats: { dishId: { 1200: 5 } } }
    const [selectedCalorieGroup, setSelectedCalorieGroup] = useState<string>('all');
    const [cookingAmounts, setCookingAmounts] = useState<Record<string, Record<string, string>>>({});
    const [isCooking, setIsCooking] = useState(false);

    // Custom set integration
    const [availableSets, setAvailableSets] = useState<MenuSet[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string>('active');

    const activeSet = useMemo(() => {
        if (selectedSetId === 'active') return availableSets.find(s => s.isActive) || null;
        return availableSets.find(s => s.id === selectedSetId) || null;
    }, [availableSets, selectedSetId]);

    useEffect(() => {
        fetchData();
    }, [menuNumber, date, selectedSetId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Active Sets first
            let currentActiveSet: MenuSet | null = null;
            try {
                const setsRes = await fetch('/api/admin/sets');
                if (setsRes.ok) {
                    const sets: MenuSet[] = await setsRes.json();
                    setAvailableSets(sets);

                    // Logic Update: determine active set based on selection or global status
                    if (selectedSetId === 'active') {
                        currentActiveSet = sets.find(s => s.isActive) || null;
                    } else {
                        currentActiveSet = sets.find(s => s.id === selectedSetId) || null;
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch sets', e);
            }

            // 2. Determine dishes based on Set or Standard Menu
            let foundSetDishes = false;

            if (currentActiveSet) {
                // Get data for the CURRENT menuNumber (day)
                // calorieGroups is now Record<string, CalorieGroup[]>
                // Ensure we access it safely as it might be typed loosely from JSON
                const setGroups = currentActiveSet.calorieGroups as unknown as Record<string, CalorieGroup[]>;

                let dayData: CalorieGroup[] | undefined;
                if (!Array.isArray(setGroups)) {
                    dayData = setGroups[menuNumber.toString()];
                }

                if (dayData && Array.isArray(dayData)) {
                    // Determine all unique dishes from this day's set config
                    const uniqueDishesMap = new Map<string, Dish>(); // Use string keys for flexibility

                    dayData.forEach(group => {
                        if (group && group.dishes) {
                            group.dishes.forEach(d => {
                                const dishKey = d.dishId.toString();
                                if (!uniqueDishesMap.has(dishKey)) {
                                    uniqueDishesMap.set(dishKey, {
                                        id: d.dishId,
                                        name: d.dishName,
                                        mealType: d.mealType
                                    });
                                }
                            });
                        }
                    });

                    if (uniqueDishesMap.size > 0) {
                        setDishes(Array.from(uniqueDishesMap.values()));
                        foundSetDishes = true;
                    }
                }
            }

            if (!foundSetDishes) {
                // Fallback to standard menu if no active set OR set has no data for this day
                const menuRes = await fetch(`/api/admin/menus?number=${menuNumber}`);
                if (menuRes.ok) {
                    const menuData = await menuRes.json();
                    if (menuData && menuData.dishes) {
                        setDishes(menuData.dishes);
                    }
                }
            }

            // 3. Fetch Cooking Plan Status
            const planRes = await fetch(`/api/admin/warehouse/cooking-plan?date=${date}`);
            if (planRes.ok) {
                const planData = await planRes.json();
                setCookingPlan(planData);
            }
        } catch (error) {
            console.error('Failed to load cooking data', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (dishId: string, calorie: number, value: string) => {
        setCookingAmounts(prev => ({
            ...prev,
            [dishId]: {
                ...(prev[dishId] || {}),
                [calorie]: value
            }
        }));
    };

    const handleCook = async (dishId: string, calorie: number | null) => {
        const updates: { dishId: string, calorie: number, amount: number }[] = [];

        if (calorie) {
            // Cook for specific calorie group
            const amount = parseInt(cookingAmounts[dishId]?.[calorie] || '0');
            if (amount <= 0) return;
            updates.push({ dishId, calorie, amount });
        } else {
            // Batch cook logic if needed, but for now we do per-cell
        }

        if (updates.length === 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsCooking(true);
        try {
            const res = await fetch('/api/admin/warehouse/cook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    menuNumber,
                    updates,
                    // Pass active set info so backend knows which ingredients to deduct
                    activeSetId: activeSet?.id
                })
            });

            if (res.ok) {
                toast.success('Приготовлено и списано со склада');
                // Clear inputs
                setCookingAmounts(prev => {
                    const newState = { ...prev };
                    updates.forEach(u => {
                        if (newState[u.dishId]) {
                            delete newState[u.dishId][u.calorie];
                        }
                    });
                    return newState;
                });
                fetchData();
                if (onCook) onCook();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to cook');
            }
        } catch (error) {
            console.error('Error cooking:', error);
            toast.error('Error cooking');
        } finally {
            setIsCooking(false);
        }
    };

    const getCookedAmount = (dishId: string, calorie: number) => {
        return cookingPlan?.cookedStats?.[dishId]?.[calorie] || 0;
    };

    const getNeededAmount = (dishId: string | number, calorie: number) => {
        // If we are using a custom set
        if (activeSet) {
            let group: CalorieGroup | undefined;
            const groups = activeSet.calorieGroups as unknown as Record<string, CalorieGroup[]>;

            if (Array.isArray(groups)) {
                // Legacy fallback
                group = groups.find((g: any) => g.calories === calorie);
            } else {
                // New structure
                const dayGroups = groups[menuNumber.toString()];
                if (dayGroups) {
                    group = dayGroups.find(g => g.calories === calorie);
                }
            }

            if (!group) return 0;

            // Check if this dish is in this calorie group
            const hasDish = group.dishes.some(d => d.dishId == dishId); // loose equality
            return hasDish ? (clientsByCalorie[calorie] || 0) : 0;
        }

        // Fallback to standard logic
        const dish = dishes.find(d => d.id == dishId);
        if (!dish) return 0;

        // If mappings exist (standard menu logic)
        if (dish.calorieMappings) {
            const allowedGroups = dish.calorieMappings[menuNumber.toString()] || [];
            if (!allowedGroups.includes(calorie.toString())) {
                return 0; // Not needed for this calorie group on this day
            }
        }

        return clientsByCalorie[calorie] || 0;
    };

    const filteredCalorieGroups = selectedCalorieGroup === 'all'
        ? CALORIE_GROUPS
        : [parseInt(selectedCalorieGroup)];

    if (loading) {
        return <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        Cooking Control
                        {activeSet && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <UtensilsCrossed className="w-3 h-3 mr-1" />
                                Custom Set: {activeSet.name}
                            </Badge>
                        )}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {activeSet
                            ? "Блюда загружены из активного сета для этого дня"
                            : "Используется стандартное меню (нет активных сетов)"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-start sm:items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-slate-500 whitespace-nowrap">Set:</span>
                        <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select Set" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Auto (Active Global)</SelectItem>
                                {availableSets.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} {s.isActive ? '✓' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-slate-500 whitespace-nowrap">Filter:</span>
                        <Select value={selectedCalorieGroup} onValueChange={setSelectedCalorieGroup}>
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Calories</SelectItem>
                                {CALORIE_GROUPS.map(c => (
                                    <SelectItem key={c} value={c.toString()}>{c} kcal</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Dish</TableHead>
                            {filteredCalorieGroups.map(cal => (
                                <TableHead key={cal} className="text-center min-w-[150px]">
                                    {cal} kcal
                                    <div className="text-xs font-normal text-slate-500">
                                        Need: {clientsByCalorie[cal] || 0}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dishes.map(dish => {
                            // Check if this dish is needed for ANY of the filtered calorie groups
                            const isNeededAnywhere = filteredCalorieGroups.some(cal => getNeededAmount(dish.id, cal) > 0);

                            // Optional: Hide dishes that aren't needed for any displayed column to clean up view
                            // if (!isNeededAnywhere) return null; 

                            return (
                                <TableRow key={dish.id}>
                                    <TableCell className="font-medium">
                                        {dish.name}
                                        <div className="text-xs text-slate-400">{dish.mealType}</div>
                                    </TableCell>
                                    {filteredCalorieGroups.map(cal => {
                                        const needed = getNeededAmount(dish.id, cal);
                                        const cooked = getCookedAmount(dish.id.toString(), cal);
                                        const remaining = Math.max(0, needed - cooked);
                                        const inputVal = cookingAmounts[dish.id.toString()]?.[cal] || '';

                                        // If not needed for this column, show greyed out or empty
                                        if (needed === 0) {
                                            return (
                                                <TableCell key={cal} className="p-2 bg-slate-50/50">
                                                    <div className="h-full flex items-center justify-center text-slate-300 text-xs text-center">
                                                        -
                                                    </div>
                                                </TableCell>
                                            );
                                        }

                                        return (
                                            <TableCell key={cal} className="p-2">
                                                <div className="bg-slate-50 rounded-lg p-2 space-y-2 border">
                                                    <div className="flex justify-between text-xs">
                                                        <span className={cooked >= needed ? "text-green-600 font-medium" : "text-amber-600"}>
                                                            Ready: {cooked}
                                                        </span>
                                                        <span className="text-slate-500">Left: {remaining}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Input
                                                            type="number"
                                                            className="h-7 text-xs px-1"
                                                            placeholder={remaining.toString()}
                                                            value={inputVal}
                                                            onChange={(e) => handleAmountChange(dish.id.toString(), cal, e.target.value)}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0"
                                                            disabled={isCooking || !inputVal}
                                                            onClick={() => handleCook(dish.id.toString(), cal)}
                                                        >
                                                            <ChefHat className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            {dishes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                    Нет блюд для отображения
                </div>
            )}
        </div>
    );
}
