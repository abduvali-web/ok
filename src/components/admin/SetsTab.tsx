'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Plus,
    Trash2,
    Edit,
    Save,
    UtensilsCrossed,
    ChefHat,
    Flame,
    Clock,
    Copy,
    MoreVertical,
    X,
    Scale,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { MENUS, MEAL_TYPES, getDishImageUrl, type Dish, type DailyMenu, type Ingredient } from '@/lib/menuData';

// Types for custom sets
interface SetDish {
    dishId: number;
    dishName: string;
    mealType: keyof typeof MEAL_TYPES;
    customIngredients?: Ingredient[]; // If set, overrides standard ingredients
}

interface CalorieGroup {
    calories: number;
    dishes: SetDish[];
}

interface MenuSet {
    id: string;
    name: string;
    description?: string;
    menuNumber: number; // 1-21
    calorieGroups: CalorieGroup[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const CALORIE_OPTIONS = [1200, 1600, 2000, 2500, 3000];

export function SetsTab() {
    const { t } = useLanguage();
    const [sets, setSets] = useState<MenuSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<MenuSet | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Add Dish State
    const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
    const [addDishTarget, setAddDishTarget] = useState<{ calorieIndex: number } | null>(null);
    const [selectedDishToAdd, setSelectedDishToAdd] = useState<string>('');
    const [selectedMealTypeToAdd, setSelectedMealTypeToAdd] = useState<string>('LUNCH');

    // Edit Dish State
    const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<{ setId: string; calorieIndex: number; dishIndex: number; dish: SetDish } | null>(null);
    const [activeCalorieTab, setActiveCalorieTab] = useState('1200');
    const [isLoading, setIsLoading] = useState(true);

    // Form state for new set
    const [newSetForm, setNewSetForm] = useState({
        name: '',
        description: '',
        menuNumber: 1,
        copyFrom: '' // ID of set to copy from
    });

    // Load sets from API
    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const response = await fetch('/api/admin/sets');
            if (response.ok) {
                const data = await response.json();
                setSets(data);
                if (data.length > 0 && !selectedSet) {
                    setSelectedSet(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching sets:', error);
            toast.error('Ошибка загрузки сетов');
        } finally {
            setIsLoading(false);
        }
    };

    const createSet = async () => {
        if (!newSetForm.name.trim()) {
            toast.error('Введите название сета');
            return;
        }

        try {
            // Get dishes from the selected menu number
            const menuData = MENUS.find(m => m.menuNumber === newSetForm.menuNumber);

            // Create calorie groups with default dishes from menu
            const calorieGroups: CalorieGroup[] = CALORIE_OPTIONS.map(calories => ({
                calories,
                dishes: menuData?.dishes.map(dish => ({
                    dishId: dish.id,
                    dishName: dish.name,
                    mealType: dish.mealType,
                    customIngredients: undefined // Will use default from menuData
                })) || []
            }));

            // If copying from another set, use its dishes
            if (newSetForm.copyFrom) {
                const sourceSet = sets.find(s => s.id === newSetForm.copyFrom);
                if (sourceSet) {
                    calorieGroups.forEach((group, index) => {
                        const sourceGroup = sourceSet.calorieGroups.find(g => g.calories === group.calories);
                        if (sourceGroup) {
                            calorieGroups[index].dishes = sourceGroup.dishes.map(d => ({ ...d })); // Deep copy needed
                        }
                    });
                }
            }

            const response = await fetch('/api/admin/sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newSetForm.name,
                    description: newSetForm.description,
                    menuNumber: newSetForm.menuNumber,
                    calorieGroups
                })
            });

            if (response.ok) {
                const newSet = await response.json();
                setSets(prev => [...prev, newSet]);
                setSelectedSet(newSet);
                setIsCreateModalOpen(false);
                setNewSetForm({ name: '', description: '', menuNumber: 1, copyFrom: '' });
                toast.success('Сет успешно создан');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Ошибка создания сета');
            }
        } catch (error) {
            console.error('Error creating set:', error);
            toast.error('Ошибка создания сета');
        }
    };

    const saveChanges = async () => {
        if (!selectedSet) return;

        try {
            const response = await fetch(`/api/admin/sets/${selectedSet.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calorieGroups: selectedSet.calorieGroups })
            });

            if (response.ok) {
                const updatedSet = await response.json();
                setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
                setSelectedSet(updatedSet);
                toast.success('Сет сохранен');
            } else {
                toast.error('Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving set:', error);
            toast.error('Ошибка сохранения');
        }
    };

    const updateEditingDish = async () => {
        if (!editingDish || !selectedSet) return;

        // This just updates the local state 'selectedSet', we need to call saveChanges to persist
        const updatedGroups = [...selectedSet.calorieGroups];
        updatedGroups[editingDish.calorieIndex].dishes[editingDish.dishIndex] = editingDish.dish;

        const updatedSet = {
            ...selectedSet,
            calorieGroups: updatedGroups
        };

        setSelectedSet(updatedSet);

        // Optimistic update locally, then save to server
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
        setIsEditDishModalOpen(false);
        setEditingDish(null);

        // Trigger save
        try {
            const response = await fetch(`/api/admin/sets/${selectedSet.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calorieGroups: updatedGroups })
            });
            if (response.ok) toast.success('Ингредиенты рецепта обновлены');
        } catch (e) {
            toast.error('Ошибка сохранения на сервере');
        }
    };

    const deleteSet = async (setId: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот сет?')) return;

        try {
            const response = await fetch(`/api/admin/sets/${setId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSets(prev => prev.filter(s => s.id !== setId));
                if (selectedSet?.id === setId) {
                    setSelectedSet(sets.find(s => s.id !== setId) || null);
                }
                toast.success('Сет удален');
            } else {
                toast.error('Ошибка удаления сета');
            }
        } catch (error) {
            console.error('Error deleting set:', error);
            toast.error('Ошибка удаления сета');
        }
    };

    const deleteDishFromGroup = (calorieIndex: number, dishIndex: number) => {
        if (!selectedSet) return;

        const updatedGroups = [...selectedSet.calorieGroups];
        updatedGroups[calorieIndex].dishes.splice(dishIndex, 1);

        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };
        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));

        // Auto-save logic could be here, or user manually saves
        // Better to autosave for smoother exp
        fetch(`/api/admin/sets/${selectedSet.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calorieGroups: updatedGroups })
        }).then(res => {
            if (res.ok) toast.success('Блюдо удалено из группы');
        });
    };

    const addDishToGroup = () => {
        if (!selectedSet || !addDishTarget || !selectedDishToAdd) return;

        const dishObj = getAllDishes().find(d => d.id.toString() === selectedDishToAdd);
        if (!dishObj) return;

        const updatedGroups = [...selectedSet.calorieGroups];
        updatedGroups[addDishTarget.calorieIndex].dishes.push({
            dishId: dishObj.id,
            dishName: dishObj.name,
            mealType: selectedMealTypeToAdd as any,
            customIngredients: undefined
        });

        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };
        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));

        fetch(`/api/admin/sets/${selectedSet.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calorieGroups: updatedGroups })
        }).then(res => {
            if (res.ok) toast.success('Блюдо добавлено');
        });

        setIsAddDishModalOpen(false);
        setAddDishTarget(null);
        setSelectedDishToAdd('');
    };

    // Get all available dishes for replacement
    const getAllDishes = (): Dish[] => {
        const uniqueDishes = new Map<number, Dish>();
        MENUS.forEach(menu => {
            menu.dishes.forEach(dish => {
                if (!uniqueDishes.has(dish.id)) {
                    uniqueDishes.set(dish.id, dish);
                }
            });
        });
        return Array.from(uniqueDishes.values());
    };

    const getOriginalIngredients = (dishId: number): Ingredient[] => {
        const dish = getAllDishes().find(d => d.id === dishId);
        return dish?.ingredients || [];
    };

    const toggleSetStatus = async (set: MenuSet) => {
        try {
            // Deactivate others with same menuNumber (optional logic, usually one active per day)
            // But let's just toggle for now
            const response = await fetch(`/api/admin/sets/${set.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !set.isActive })
            });

            if (response.ok) {
                const updated = await response.json();
                setSets(prev => prev.map(s => s.id === updated.id ? updated : s));
                if (selectedSet?.id === updated.id) setSelectedSet(updated);
                toast.success(`Сет ${updated.isActive ? 'активирован' : 'деактивирован'}`);
            }
        } catch (e) {
            toast.error('Ошибка обновления статуса');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold">Управление Сетами (Склад)</h2>
                    <p className="text-sm text-muted-foreground">
                        Настройка ингредиентов и состава сетов для готовки
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Новый сет
                </Button>
            </div>

            {/* Sets List + Selected Set View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Sets List */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="glass-card border-none h-[calc(100vh-200px)] overflow-hidden flex flex-col">
                        <CardHeader className="pb-2 bg-slate-50/50">
                            <CardTitle className="text-base flex items-center justify-between">
                                Ваши сеты
                                <Badge variant="outline">{sets.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-2">
                                {sets.map(set => (
                                    <div
                                        key={set.id}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border relative group ${selectedSet?.id === set.id
                                            ? 'bg-white border-primary shadow-sm'
                                            : 'bg-slate-50 hover:bg-white border-transparent hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedSet(set)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`font-medium text-sm ${selectedSet?.id === set.id ? 'text-primary' : 'text-slate-900'}`}>{set.name}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">Меню дня: {set.menuNumber}</p>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleSetStatus(set)}
                                                    className={`w-3 h-3 rounded-full ${set.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                                                    title={set.isActive ? "Активен" : "Неактивен"}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {set.description && (
                                                <p className="text-[10px] text-slate-400 truncate flex-1">{set.description}</p>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSet(set.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-red-400 hover:text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {sets.length === 0 && (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        Нет сетов
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Selected Set Details */}
                <div className="lg:col-span-9">
                    {selectedSet ? (
                        <Card className="glass-card border-none h-full flex flex-col">
                            <CardHeader className="pb-2 border-b border-slate-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <UtensilsCrossed className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{selectedSet.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="font-normal">День {selectedSet.menuNumber}</Badge>
                                                {selectedSet.isActive ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Активен</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Неактивен</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => toggleSetStatus(selectedSet)}>
                                            {selectedSet.isActive ? 'Деактивировать' : 'Активировать'}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteSet(selectedSet.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <Tabs value={activeCalorieTab} onValueChange={setActiveCalorieTab} className="h-full flex flex-col">
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                                        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
                                            {CALORIE_OPTIONS.map(cal => (
                                                <TabsTrigger
                                                    key={cal}
                                                    value={cal.toString()}
                                                    className="text-xs px-1 py-1.5"
                                                >
                                                    <Flame className="w-3 h-3 mr-1 text-orange-500 hidden sm:inline" />
                                                    {cal}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {CALORIE_OPTIONS.map((cal, calIdx) => {
                                        const group = selectedSet.calorieGroups.find(g => g.calories === cal);
                                        const groupIndex = selectedSet.calorieGroups.findIndex(g => g.calories === cal);

                                        return (
                                            <TabsContent key={cal} value={cal.toString()} className="flex-1 p-6 space-y-6 m-0 animate-in fade-in-50">
                                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                                        Рацион {cal} ккал
                                                        <Badge variant="secondary" className="font-normal text-xs">{group?.dishes.length || 0} блюд</Badge>
                                                    </h3>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setAddDishTarget({ calorieIndex: groupIndex });
                                                            setIsAddDishModalOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Добавить
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {group?.dishes.map((dish, dishIdx) => (
                                                        <div
                                                            key={`${dish.dishId}-${dishIdx}`}
                                                            className="flex gap-3 p-3 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all group relative"
                                                        >
                                                            {/* Image */}
                                                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                                                <img
                                                                    src={getDishImageUrl(dish.dishId)}
                                                                    alt={dish.dishName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => (e.target as HTMLImageElement).src = '/api/placeholder/100/100'}
                                                                />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <Badge variant="outline" className="text-[10px] mb-1 px-1.5 py-0 h-4">{MEAL_TYPES[dish.mealType]}</Badge>
                                                                        <h4 className="font-medium text-sm leading-snug">{dish.dishName}</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 flex items-center justify-between">
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                        {dish.customIngredients ? (
                                                                            <span className="text-amber-600 font-medium flex items-center">
                                                                                <Scale className="w-3 h-3 mr-1" />
                                                                                Изм. состав
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center">
                                                                                <Scale className="w-3 h-3 mr-1" />
                                                                                Стандарт
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-slate-400 hover:text-primary"
                                                                            onClick={() => {
                                                                                setEditingDish({
                                                                                    setId: selectedSet.id,
                                                                                    calorieIndex: groupIndex,
                                                                                    dishIndex: dishIdx,
                                                                                    dish: { ...dish }
                                                                                });
                                                                                setIsEditDishModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Edit className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                                            onClick={() => deleteDishFromGroup(groupIndex, dishIdx)}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!group?.dishes || group.dishes.length === 0) && (
                                                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                                                            <p className="text-muted-foreground mb-2">В этой группе пока нет блюд</p>
                                                            <Button variant="outline" onClick={() => {
                                                                setAddDishTarget({ calorieIndex: groupIndex });
                                                                setIsAddDishModalOpen(true);
                                                            }}>
                                                                <Plus className="w-4 h-4 mr-2" />
                                                                Добавить блюдо
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="glass-card border-none h-full flex items-center justify-center">
                            <CardContent className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <UtensilsCrossed className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Выберите или создайте сет</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                    Создавайте наборы меню для разных калорийных групп и настраивайте ингредиенты для точного учета склада.
                                </p>
                                <Button size="lg" onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Создать первый сет
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Set Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый Кастомный Сет</DialogTitle>
                        <DialogDescription>
                            Базовая структура будет скопирована из выбранного дня меню или другого сета.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Название</Label>
                            <Input
                                value={newSetForm.name}
                                onChange={(e) => setNewSetForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Например: Сет Зима-2026"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Описание</Label>
                            <Input
                                value={newSetForm.description}
                                onChange={(e) => setNewSetForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Опционально"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>День Меню (1-21)</Label>
                                <Select
                                    value={newSetForm.menuNumber.toString()}
                                    onValueChange={(v) => setNewSetForm(prev => ({ ...prev, menuNumber: parseInt(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 21 }, (_, i) => i + 1).map(num => (
                                            <SelectItem key={num} value={num.toString()}>День {num}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Отмена</Button>
                        <Button onClick={createSet}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Dish Modal */}
            <Dialog open={isAddDishModalOpen} onOpenChange={setIsAddDishModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить блюдо</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Прием пищи</Label>
                            <Select value={selectedMealTypeToAdd} onValueChange={setSelectedMealTypeToAdd}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(MEAL_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Выберите блюдо</Label>
                            <Select value={selectedDishToAdd} onValueChange={setSelectedDishToAdd}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Поиск блюда..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {getAllDishes()
                                        .filter(d => d.mealType === selectedMealTypeToAdd)
                                        .map(d => (
                                            <SelectItem key={d.id} value={d.id.toString()}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDishModalOpen(false)}>Отмена</Button>
                        <Button onClick={addDishToGroup} disabled={!selectedDishToAdd}>Добавить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Ingredients Modal */}
            <Dialog open={isEditDishModalOpen} onOpenChange={setIsEditDishModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Состав блюда: {editingDish?.dish.dishName}</DialogTitle>
                        <DialogDescription>
                            Настройте граммовку ингредиентов специально для этого сета
                        </DialogDescription>
                    </DialogHeader>

                    {editingDish && (
                        <div className="flex-1 overflow-auto py-2">
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Изменения затронут расчеты списания со склада только для этого сета и этой калорийности ({CALORIE_OPTIONS[editingDish.calorieIndex]} ккал).</p>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ингредиент</TableHead>
                                        <TableHead className="w-[100px]">Кол-во</TableHead>
                                        <TableHead className="w-[80px]">Ед.изм</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(editingDish.dish.customIngredients || getOriginalIngredients(editingDish.dish.dishId)).map((ing, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{ing.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8"
                                                    value={ing.amount}
                                                    onChange={(e) => {
                                                        const newVal = parseFloat(e.target.value) || 0;
                                                        const currentIngredients = editingDish.dish.customIngredients
                                                            ? [...editingDish.dish.customIngredients]
                                                            : [...getOriginalIngredients(editingDish.dish.dishId)];

                                                        // Ensure customIngredients is initialized if it wasn't
                                                        if (!editingDish.dish.customIngredients) {
                                                            // We are starting to customize, so we need to copy initial structure
                                                        }

                                                        currentIngredients[idx] = { ...currentIngredients[idx], amount: newVal };

                                                        setEditingDish({
                                                            ...editingDish,
                                                            dish: {
                                                                ...editingDish.dish,
                                                                customIngredients: currentIngredients
                                                            }
                                                        });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{ing.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 text-xs"
                                    onClick={() => {
                                        setEditingDish({
                                            ...editingDish,
                                            dish: {
                                                ...editingDish.dish,
                                                customIngredients: undefined // Reset to standard
                                            }
                                        });
                                        toast.info('Сброшено до стандарта');
                                    }}
                                >
                                    Сбросить до стандарта
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDishModalOpen(false)}>Отмена</Button>
                        <Button onClick={updateEditingDish}>Сохранить изменения</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
