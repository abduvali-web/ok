'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Package,
    Calculator,
    ShoppingCart,
    Save,
    Plus,
    Minus,
    Calendar,
    ChefHat,
    Loader2,
    RefreshCw,
    Utensils
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getTomorrowsMenuNumber,
    getTomorrowsMenu,
    getMenu,
    getMenuNumber,
    getDishImageUrl,
    calculateIngredientsForMenu,
    calculateShoppingList,
    getAllIngredients,
    MEAL_TYPES,
    type DailyMenu,
    type Dish,
} from '@/lib/menuData';
import { DishesManager } from './warehouse/DishesManager';
import { IngredientsManager } from './warehouse/IngredientsManager';

interface WarehouseTabProps {
    className?: string;
}

interface DishQuantity {
    dishId: number;
    quantity: number;
}

interface InventoryItem {
    name: string;
    amount: number;
    unit: string;
}

export function WarehouseTab({ className }: WarehouseTabProps) {
    const [activeSubTab, setActiveSubTab] = useState('cooking');
    const [tomorrowMenu, setTomorrowMenu] = useState<DailyMenu | undefined>(undefined);
    const [tomorrowMenuNumber, setTomorrowMenuNumber] = useState<number>(0);
    const [dishQuantities, setDishQuantities] = useState<Record<number, number>>({});
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [clientsByCalorie, setClientsByCalorie] = useState<Record<number, number>>({
        1200: 0,
        1600: 0,
        2000: 0,
        2500: 0,
        3000: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Calculation state
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [calculatedIngredients, setCalculatedIngredients] = useState<Map<string, { amount: number; unit: string }>>(new Map());
    const [shoppingList, setShoppingList] = useState<Map<string, { amount: number; unit: string }>>(new Map());

    // Load tomorrow's menu on mount
    useEffect(() => {
        const menuNumber = getTomorrowsMenuNumber();
        setTomorrowMenuNumber(menuNumber);
        const menu = getTomorrowsMenu();
        setTomorrowMenu(menu);

        // Initialize dish quantities
        if (menu) {
            const initialQuantities: Record<number, number> = {};
            menu.dishes.forEach(dish => {
                initialQuantities[dish.id] = 1;
            });
            setDishQuantities(initialQuantities);
        }

        // Fetch data from API
        fetchData();
    }, [tomorrowMenuNumber]);

    // Fetch client calorie distribution from database
    const fetchClientCalories = useCallback(async () => {
        setIsLoadingClients(true);
        try {
            const response = await fetch('/api/admin/clients');
            if (response.ok) {
                const clients = await response.json();
                const distribution: Record<number, number> = {
                    1200: 0,
                    1600: 0,
                    2000: 0,
                    2500: 0,
                    3000: 0,
                };

                clients.forEach((client: { calories?: number; isActive?: boolean }) => {
                    if (client.isActive !== false) {
                        const calories = client.calories || 2000;
                        // Map to nearest tier
                        if (calories <= 1400) distribution[1200]++;
                        else if (calories <= 1800) distribution[1600]++;
                        else if (calories <= 2200) distribution[2000]++;
                        else if (calories <= 2800) distribution[2500]++;
                        else distribution[3000]++;
                    }
                });

                setClientsByCalorie(distribution);
                toast.success('Данные клиентов обновлены');
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
            toast.error('Ошибка загрузки данных клиентов');
        } finally {
            setIsLoadingClients(false);
        }
    }, []);

    useEffect(() => {
        fetchClientCalories();
    }, [fetchClientCalories]);

    const fetchData = async () => {
        try {
            // Fetch inventory
            const invResponse = await fetch('/api/admin/warehouse/inventory');
            if (invResponse.ok) {
                const data = await invResponse.json();
                setInventory(data);
            }

            // Fetch cooking plan for tomorrow (based on tomorrowMenuNumber and date)
            // We need the date for tomorrow. getTomorrowsMenuNumber() implies +1 day from today roughly, 
            // but let's be precise. The menu cycle starts Dec 4.
            // Actually, we can just save/load by date.
            // Let's assume tomorrow's date for the query.
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const planResponse = await fetch(`/api/admin/warehouse/cooking-plan?date=${dateStr}`);
            if (planResponse.ok) {
                const data = await planResponse.json();
                if (data.dishes) {
                    setDishQuantities(data.dishes);
                }
            }
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
            toast.error('Ошибка загрузки данных склада');
        }
    };

    const handleImageError = (dishId: number) => {
        setImageErrors(prev => new Set(prev).add(dishId));
    };

    const updateDishQuantity = (dishId: number, delta: number) => {
        setDishQuantities(prev => ({
            ...prev,
            [dishId]: Math.max(0, (prev[dishId] || 0) + delta),
        }));
    };

    const handleQuantityChange = (dishId: number, value: string) => {
        const num = parseInt(value) || 0;
        setDishQuantities(prev => ({
            ...prev,
            [dishId]: Math.max(0, num),
        }));
    };

    const updateInventory = (name: string, value: string) => {
        const num = parseFloat(value) || 0;
        setInventory(prev => ({
            ...prev,
            [name]: Math.max(0, num),
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save Inventory
            const invPromise = fetch('/api/admin/warehouse/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventory),
            });

            // Save Cooking Plan
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const planPromise = fetch('/api/admin/warehouse/cooking-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: tomorrow.toISOString(),
                    menuNumber: tomorrowMenuNumber,
                    dishes: dishQuantities
                }),
            });

            await Promise.all([invPromise, planPromise]);
            toast.success('Данные успешно сохранены в базе');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Ошибка сохранения');
        } finally {
            setIsSaving(false);
        }
    };

    const calculateForTomorrow = () => {
        const ingredients = calculateIngredientsForMenu(
            tomorrowMenuNumber,
            clientsByCalorie,
            dishQuantities
        );
        setCalculatedIngredients(ingredients);

        const shopping = calculateShoppingList(ingredients, inventory);
        setShoppingList(shopping);

        toast.success(`Расчёт для меню ${tomorrowMenuNumber} выполнен`);
    };

    const calculateForPeriod = () => {
        if (selectedDates.length === 0) {
            toast.error('Выберите даты для расчёта');
            return;
        }

        const totalIngredients = new Map<string, { amount: number; unit: string }>();

        for (const dateStr of selectedDates) {
            const date = new Date(dateStr);
            const menuNumber = getMenuNumber(date);
            const menuIngredients = calculateIngredientsForMenu(
                menuNumber,
                clientsByCalorie,
                dishQuantities
            );

            for (const [name, { amount, unit }] of menuIngredients) {
                const existing = totalIngredients.get(name);
                if (existing) {
                    existing.amount = Math.round((existing.amount + amount) * 10) / 10;
                } else {
                    totalIngredients.set(name, { amount, unit });
                }
            }
        }

        setCalculatedIngredients(totalIngredients);
        const shopping = calculateShoppingList(totalIngredients, inventory);
        setShoppingList(shopping);

        toast.success(`Расчёт для ${selectedDates.length} дней выполнен`);
    };

    const handleDateToggle = (dateStr: string) => {
        setSelectedDates(prev => {
            if (prev.includes(dateStr)) {
                return prev.filter(d => d !== dateStr);
            }
            return [...prev, dateStr];
        });
    };

    // Generate next 14 days for selection
    const getNext14Days = (): Array<{ date: string; label: string; menuNumber: number }> => {
        const days: Array<{ date: string; label: string; menuNumber: number }> = [];
        const today = new Date();
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                date: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }),
                menuNumber: getMenuNumber(date),
            });
        }
        return days;
    };

    const mealTypeIcons: Record<keyof typeof MEAL_TYPES, string> = {
        BREAKFAST: '🌅',
        SECOND_BREAKFAST: '🥐',
        LUNCH: '🍽️',
        SNACK: '🍎',
        DINNER: '🌙',
        SIXTH_MEAL: '🥗',
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <Card className="glass-card border-none">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Package className="w-5 h-5 text-primary" />
                                Управление складом
                            </CardTitle>
                            <CardDescription>
                                Планирование готовки и расчёт ингредиентов
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 bg-primary/5">
                                <ChefHat className="w-4 h-4" />
                                <span>Готовим меню {tomorrowMenuNumber}</span>
                            </Badge>
                            <Button variant="outline" size="sm" onClick={fetchClientCalories} disabled={isLoadingClients}>
                                {isLoadingClients ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            <TabsTrigger value="cooking" className="flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                <span className="hidden sm:inline">Готовка</span>
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span className="hidden sm:inline">Остатки</span>
                            </TabsTrigger>
                            <TabsTrigger value="calculator" className="flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                <span className="hidden sm:inline">Калькулятор</span>
                            </TabsTrigger>
                            <TabsTrigger value="dishes" className="flex items-center gap-2">
                                <Utensils className="w-4 h-4" />
                                <span className="hidden sm:inline">Блюда</span>
                            </TabsTrigger>
                            <TabsTrigger value="ingredients-catalog" className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span className="hidden sm:inline">Справочник</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Cooking Tab - Dishes to prepare for tomorrow */}
                        <TabsContent value="cooking" className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <strong>Меню {tomorrowMenuNumber}</strong> — блюда для готовки сегодня, доставка завтра.
                                Укажите количество порций для каждого блюда.
                            </div>

                            {/* Client distribution info */}
                            <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg">
                                {Object.entries(clientsByCalorie).map(([cal, count]) => (
                                    <div key={cal} className="text-center">
                                        <div className="text-xs text-slate-500">{cal} ккал</div>
                                        <div className="font-semibold text-lg">{count}</div>
                                        <div className="text-xs text-slate-400">клиентов</div>
                                    </div>
                                ))}
                            </div>

                            {tomorrowMenu && (
                                <div className="space-y-4">
                                    {tomorrowMenu.dishes.map((dish) => (
                                        <div
                                            key={dish.id}
                                            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
                                        >
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                {!imageErrors.has(dish.id) ? (
                                                    <img
                                                        src={getDishImageUrl(dish.id)}
                                                        alt={dish.name}
                                                        className="w-full h-full object-cover"
                                                        onError={() => handleImageError(dish.id)}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                                                        {mealTypeIcons[dish.mealType]}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm">{mealTypeIcons[dish.mealType]}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {MEAL_TYPES[dish.mealType]}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-medium text-slate-900 truncate">{dish.name}</h4>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {dish.ingredients.map(i => i.name).join(', ')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => updateDishQuantity(dish.id, -1)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={dishQuantities[dish.id] || 0}
                                                    onChange={(e) => handleQuantityChange(dish.id, e.target.value)}
                                                    className="w-16 text-center"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => updateDishQuantity(dish.id, 1)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Сохранить
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Inventory Tab - Remaining ingredients */}
                        <TabsContent value="inventory" className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                Укажите остатки ингредиентов на складе для точного расчёта закупок.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {getAllIngredients().map((name) => (
                                    <div key={name} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                                        <Label className="flex-1 text-sm truncate" title={name}>
                                            {name}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={inventory[name] || ''}
                                            onChange={(e) => updateInventory(name, e.target.value)}
                                            placeholder="0"
                                            className="w-20 text-right"
                                        />
                                        <span className="text-xs text-slate-400 w-8">гр</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Сохранить остатки
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Calculator Tab - Multi-day calculation */}
                        <TabsContent value="calculator" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Date selection */}
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                        Выберите дни для расчёта необходимых ингредиентов.
                                    </div>

                                    <Button onClick={calculateForTomorrow} className="w-full gap-2" variant="default">
                                        <Calculator className="w-4 h-4" />
                                        Расчёт на завтра (Меню {tomorrowMenuNumber})
                                    </Button>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Или выберите несколько дней:</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {getNext14Days().map(({ date, label, menuNumber }) => (
                                                <button
                                                    key={date}
                                                    onClick={() => handleDateToggle(date)}
                                                    className={`p-2 text-left rounded-lg border transition-colors ${selectedDates.includes(date)
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white hover:bg-slate-50 border-slate-200'
                                                        }`}
                                                >
                                                    <div className="text-sm font-medium">{label}</div>
                                                    <div className={`text-xs ${selectedDates.includes(date) ? 'text-white/80' : 'text-slate-500'
                                                        }`}>
                                                        Меню {menuNumber}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {selectedDates.length > 0 && (
                                            <Button onClick={calculateForPeriod} className="w-full gap-2 mt-2">
                                                <Calculator className="w-4 h-4" />
                                                Рассчитать для {selectedDates.length} дней
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Results */}
                                <div className="space-y-4">
                                    {calculatedIngredients.size > 0 && (
                                        <>
                                            <div>
                                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                                    <Package className="w-4 h-4" />
                                                    Необходимые ингредиенты
                                                </h4>
                                                <div className="bg-white rounded-lg border max-h-48 overflow-y-auto">
                                                    {Array.from(calculatedIngredients.entries()).map(([name, { amount, unit }]) => (
                                                        <div key={name} className="flex justify-between p-2 border-b last:border-0 text-sm">
                                                            <span className="text-slate-700">{name}</span>
                                                            <span className="font-medium">{amount} {unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-2 flex items-center gap-2 text-orange-600">
                                                    <ShoppingCart className="w-4 h-4" />
                                                    Список закупок (нужно докупить)
                                                </h4>
                                                <div className="bg-orange-50 rounded-lg border border-orange-200 max-h-48 overflow-y-auto">
                                                    {shoppingList.size > 0 ? (
                                                        Array.from(shoppingList.entries()).map(([name, { amount, unit }]) => (
                                                            <div key={name} className="flex justify-between p-2 border-b border-orange-100 last:border-0 text-sm">
                                                                <span className="text-orange-800">{name}</span>
                                                                <span className="font-medium text-orange-900">{amount} {unit}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-green-600 text-sm">
                                                            ✅ Все ингредиенты в наличии!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {calculatedIngredients.size === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>Нажмите кнопку расчёта для просмотра результатов</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* NEW: Dishes Management Tab */}
                        <TabsContent value="dishes">
                            <DishesManager />
                        </TabsContent>

                        {/* NEW: Ingredients Catalog Tab */}
                        <TabsContent value="ingredients-catalog">
                            <IngredientsManager />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
