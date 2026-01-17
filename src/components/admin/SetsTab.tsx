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
    AlertTriangle,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { MENUS, MEAL_TYPES, getDishImageUrl, type Dish, type DailyMenu, type Ingredient } from '@/lib/menuData';

// Types for custom sets
interface SetDish {
    dishId: number;
    dishName: string;
    mealType: keyof typeof MEAL_TYPES;
    customIngredients?: Ingredient[];
}

interface CalorieGroup {
    calories: number;
    dishes: SetDish[];
}

// Map day number (string) to array of calorie groups
type DayConfig = Record<string, CalorieGroup[]>;

interface MenuSet {
    id: string;
    name: string;
    description?: string;
    menuNumber: number; // Ignored/0 for global sets
    calorieGroups: DayConfig; // Changed structure!
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const CALORIE_OPTIONS = [1200, 1600, 2000, 2500, 3000];

export function SetsTab() {
    const { t } = useLanguage();
    const [sets, setSets] = useState<MenuSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<MenuSet | null>(null);
    const [activeDay, setActiveDay] = useState<string>("1"); // Current day being edited (1-21)

    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
    const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State
    const [activeCalorieTab, setActiveCalorieTab] = useState('1200');
    const [addDishTarget, setAddDishTarget] = useState<{ calorieIndex: number } | null>(null);
    const [selectedDishToAdd, setSelectedDishToAdd] = useState<string>('');
    const [selectedMealTypeToAdd, setSelectedMealTypeToAdd] = useState<string>('LUNCH');
    const [editingDish, setEditingDish] = useState<{ setId: string; calorieIndex: number; dishIndex: number; dish: SetDish } | null>(null);

    // Form state for new set
    const [newSetForm, setNewSetForm] = useState({
        name: '',
        description: ''
    });

    // Load sets
    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        setIsLoading(true);
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
            const response = await fetch('/api/admin/sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newSetForm.name,
                    description: newSetForm.description
                })
            });

            if (response.ok) {
                const newSet = await response.json();
                setSets(prev => [newSet, ...prev]);
                setSelectedSet(newSet);
                setIsCreateModalOpen(false);
                setNewSetForm({ name: '', description: '' });
                toast.success('Сет создан');
            } else {
                toast.error('Ошибка создания');
            }
        } catch (error) {
            toast.error('Ошибка создания');
        }
    };

    // Helper: Get data for current day, or init default
    const getCurrentDayData = (): CalorieGroup[] => {
        if (!selectedSet) return [];

        // Safety check for legacy data
        if (Array.isArray(selectedSet.calorieGroups)) return [];

        // Check if data exists for this day
        const dayData = (selectedSet.calorieGroups as any)[activeDay];

        if (dayData) return dayData;

        return [];
    };

    // Copy standard menu to current day
    const copyStandardMenuToDay = async () => {
        if (!selectedSet) return;

        const dayNum = parseInt(activeDay);
        const menuData = MENUS.find(m => m.menuNumber === dayNum);

        if (!menuData) {
            toast.error('Стандартное меню для этого дня не найдено');
            return;
        }

        const newDayData: CalorieGroup[] = CALORIE_OPTIONS.map(calories => ({
            calories,
            dishes: menuData.dishes.map(dish => ({
                dishId: dish.id,
                dishName: dish.name,
                mealType: dish.mealType,
                customIngredients: undefined
            }))
        }));

        const updatedGroups = {
            ...(selectedSet.calorieGroups || {}),
            [activeDay]: newDayData
        };

        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };

        // Optimistic
        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));

        // Save
        await saveSet(updatedSet);
        toast.success(`Меню дня ${activeDay} скопировано`);
    };

    const saveSet = async (setToSave: MenuSet) => {
        try {
            await fetch(`/api/admin/sets/${setToSave.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calorieGroups: setToSave.calorieGroups })
            });
        } catch (e) {
            console.error(e);
            toast.error('Ошибка сохранения');
        }
    };

    // CRUD Operations for Dishes (similar to before but aware of Day structure)

    const updateEditingDish = async () => {
        if (!editingDish || !selectedSet) return;

        const currentData = getCurrentDayData();
        const updatedDayData = [...currentData];

        // Ensure structure exists
        if (!updatedDayData[editingDish.calorieIndex]) return;

        updatedDayData[editingDish.calorieIndex].dishes[editingDish.dishIndex] = editingDish.dish;

        const updatedGroups = {
            ...(selectedSet.calorieGroups || {}),
            [activeDay]: updatedDayData
        };

        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };

        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
        setIsEditDishModalOpen(false);
        setEditingDish(null);

        await saveSet(updatedSet);
        toast.success('Сохранено');
    };

    const deleteDishFromGroup = async (calorieIndex: number, dishIndex: number) => {
        if (!selectedSet) return;

        const currentData = getCurrentDayData();
        const updatedDayData = [...currentData]; // Shallow copy of array

        // Deep copy of dishes array to modify it
        updatedDayData[calorieIndex] = {
            ...updatedDayData[calorieIndex],
            dishes: [...updatedDayData[calorieIndex].dishes]
        };

        updatedDayData[calorieIndex].dishes.splice(dishIndex, 1);

        const updatedGroups = {
            ...(selectedSet.calorieGroups || {}),
            [activeDay]: updatedDayData
        };
        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };

        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
        await saveSet(updatedSet);
    };

    const addDishToGroup = async () => {
        if (!selectedSet || !addDishTarget || !selectedDishToAdd) return;

        const dishObj = getAllDishes().find(d => d.id.toString() === selectedDishToAdd);
        if (!dishObj) return;

        const currentData = getCurrentDayData();

        // If empty, init it first? But copyStandardMenuToDay handles bulk init.
        // Assuming array exists if we are adding via button which is inside tab content

        const updatedDayData = [...currentData];
        if (updatedDayData.length === 0) {
            // Edge case: empty day, user clicks add manually without copying
            // Initialize structure
            updatedDayData.push(...CALORIE_OPTIONS.map(c => ({ calories: c, dishes: [] })));
        }

        updatedDayData[addDishTarget.calorieIndex] = {
            ...updatedDayData[addDishTarget.calorieIndex],
            dishes: [...updatedDayData[addDishTarget.calorieIndex].dishes]
        };

        updatedDayData[addDishTarget.calorieIndex].dishes.push({
            dishId: dishObj.id,
            dishName: dishObj.name,
            mealType: selectedMealTypeToAdd as any,
            customIngredients: undefined
        });

        const updatedGroups = {
            ...(selectedSet.calorieGroups || {}),
            [activeDay]: updatedDayData
        };

        const updatedSet = { ...selectedSet, calorieGroups: updatedGroups };
        setSelectedSet(updatedSet);
        setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));

        setIsAddDishModalOpen(false);
        setAddDishTarget(null);
        setSelectedDishToAdd('');

        await saveSet(updatedSet);
        toast.success('Блюдо добавлено');
    };

    const toggleSetStatus = async (set: MenuSet) => {
        try {
            const response = await fetch(`/api/admin/sets/${set.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !set.isActive })
            });

            if (response.ok) {
                const updated = await response.json();
                // Update local list - set only this one active, others inactive
                setSets(prev => prev.map(s => {
                    if (s.id === updated.id) return { ...s, isActive: updated.isActive }; // Update target
                    if (updated.isActive) return { ...s, isActive: false }; // Deactivate others if target became active
                    return s;
                }));

                if (selectedSet?.id === updated.id) {
                    setSelectedSet({ ...selectedSet, isActive: updated.isActive });
                }

                toast.success('Статус обновлен');
            }
        } catch (e) { toast.error('Ошибка'); }
    };

    const deleteSet = async (id: string) => {
        if (!confirm('Удалить этот сет?')) return;
        await fetch(`/api/admin/sets/${id}`, { method: 'DELETE' });
        setSets(prev => prev.filter(s => s.id !== id));
        if (selectedSet?.id === id) setSelectedSet(null);
        toast.success('Удалено');
    };

    const getAllDishes = (): Dish[] => {
        const uniqueDishes = new Map<number, Dish>();
        MENUS.forEach(menu => {
            menu.dishes.forEach(dish => {
                if (!uniqueDishes.has(dish.id)) uniqueDishes.set(dish.id, dish);
            });
        });
        return Array.from(uniqueDishes.values());
    };

    const getOriginalIngredients = (dishId: number): Ingredient[] => {
        const dish = getAllDishes().find(d => d.id === dishId);
        return dish?.ingredients || [];
    };

    const currentDayData = getCurrentDayData();
    const hasDataForDay = currentDayData && currentDayData.length > 0;

    if (isLoading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent mx-auto"></div></div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Глобальные Сеты</h2>
                    <p className="text-sm text-muted-foreground">Настройка меню на все 21 день</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" /> Новый Сет
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar List */}
                <div className="lg:col-span-3">
                    <Card className="h-[calc(100vh-200px)] flex flex-col">
                        <CardHeader className="bg-slate-50 border-b py-3">
                            <CardTitle className="text-sm">Список Сетов</CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-2">
                                {sets.map(set => (
                                    <div
                                        key={set.id}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedSet?.id === set.id ? 'bg-primary/5 border-primary shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}
                                        onClick={() => setSelectedSet(set)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={`font-semibold text-sm ${selectedSet?.id === set.id ? 'text-primary' : ''}`}>{set.name}</h4>
                                            <div className={`w-2 h-2 rounded-full ${set.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-200'}`} />
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-slate-400">
                                                Обновлено: {new Date(set.updatedAt).toLocaleDateString()}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={(e) => { e.stopPropagation(); deleteSet(set.id); }}>
                                                <Trash2 className="w-3 h-3 text-red-300 hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    {selectedSet ? (
                        <div className="space-y-4">
                            {/* Day Selector Bar */}
                            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                                <div className="p-2 overflow-x-auto">
                                    <div className="flex items-center gap-1 min-w-max">
                                        <span className="text-xs font-medium px-2 text-slate-400 mr-2 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Дни:
                                        </span>
                                        {Array.from({ length: 21 }, (_, i) => i + 1).map(day => (
                                            <button
                                                key={day}
                                                onClick={() => setActiveDay(day.toString())}
                                                className={`
                                                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                    ${activeDay === day.toString()
                                                        ? 'bg-primary text-white shadow-lg scale-110'
                                                        : 'hover:bg-slate-700 text-slate-300'}
                                                `}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card className="min-h-[600px] flex flex-col">
                                <CardHeader className="border-b bg-slate-50 flex flex-row items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                                            {activeDay}
                                        </div>
                                        <div>
                                            <CardTitle>Меню на День {activeDay}</CardTitle>
                                            <CardDescription>Настройка рациона для выбранного дня в сете "{selectedSet.name}"</CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={selectedSet.isActive ? "default" : "outline"}
                                            onClick={() => toggleSetStatus(selectedSet)}
                                            className={selectedSet.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
                                            {selectedSet.isActive ? "Сет Активен" : "Активировать Сет"}
                                        </Button>
                                    </div>
                                </CardHeader>

                                {/* Day Content */}
                                <CardContent className="flex-1 p-0">
                                    {!hasDataForDay ? (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                            <UtensilsCrossed className="w-16 h-16 text-slate-200 mb-4" />
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">Меню на этот день пусто</h3>
                                            <p className="max-w-md mb-6">Вы можете начать с чистого листа или скопировать стандартное меню для Дня {activeDay}, чтобы ускорить процесс.</p>
                                            <Button onClick={copyStandardMenuToDay}>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Скопировать стандартное меню (День {activeDay})
                                            </Button>
                                        </div>
                                    ) : (
                                        <Tabs value={activeCalorieTab} onValueChange={setActiveCalorieTab} className="h-full flex flex-col">
                                            <div className="px-6 py-2 border-b">
                                                <TabsList className="grid grid-cols-5 w-full">
                                                    {CALORIE_OPTIONS.map(cal => (
                                                        <TabsTrigger key={cal} value={cal.toString()}>{cal} ккал</TabsTrigger>
                                                    ))}
                                                </TabsList>
                                            </div>

                                            {CALORIE_OPTIONS.map(cal => {
                                                const group = currentDayData.find(g => g.calories === cal);
                                                const groupIdx = currentDayData.findIndex(g => g.calories === cal);

                                                return (
                                                    <TabsContent key={cal} value={cal.toString()} className="flex-1 p-6 m-0 bg-slate-50/30">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <Flame className="w-5 h-5 text-orange-500" />
                                                                <span className="font-semibold text-lg">{cal} ккал</span>
                                                            </div>
                                                            <Button size="sm" onClick={() => {
                                                                setAddDishTarget({ calorieIndex: groupIdx });
                                                                setIsAddDishModalOpen(true);
                                                            }}>
                                                                <Plus className="w-4 h-4 mr-2" /> Добавить блюдо
                                                            </Button>
                                                        </div>

                                                        {/* Dishes Grid */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                            {group?.dishes.map((dish, idx) => (
                                                                <div key={`${dish.dishId}-${idx}`} className="bg-white p-3 rounded-xl border hover:shadow-md transition-all flex gap-3 group relative">
                                                                    <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                                        <img
                                                                            src={getDishImageUrl(dish.dishId)}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => (e.target as HTMLImageElement).src = '/dashboard/placeholder-dish.png'}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <Badge variant="outline" className="text-[10px] mb-1">{MEAL_TYPES[dish.mealType]}</Badge>
                                                                                <h4 className="font-medium text-sm line-clamp-2">{dish.dishName}</h4>
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                                                    setEditingDish({
                                                                                        setId: selectedSet.id,
                                                                                        calorieIndex: groupIdx,
                                                                                        dishIndex: idx,
                                                                                        dish: { ...dish }
                                                                                    });
                                                                                    setIsEditDishModalOpen(true);
                                                                                }}>
                                                                                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDishFromGroup(groupIdx, idx)}>
                                                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-2 text-xs text-slate-500">
                                                                            {dish.customIngredients ? (
                                                                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                                                                    <Scale className="w-3 h-3" /> Кастомный вес
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                                    <Scale className="w-3 h-3" /> Стандарт
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!group?.dishes || group.dishes.length === 0) && (
                                                                <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed rounded-lg">
                                                                    Нет блюд
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TabsContent>
                                                );
                                            })}
                                        </Tabs>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ArrowRight className="w-8 h-8 text-slate-300" />
                            </div>
                            <p>Выберите сет слева, чтобы начать редактирование</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый Глобальный Сет</DialogTitle>
                        <DialogDescription>Создайте пустой сет, а затем настройте каждый день.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Название сета</Label>
                            <Input
                                value={newSetForm.name}
                                onChange={(e) => setNewSetForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Например: Зима 2026 (Спорт)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={createSet}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Dish Modal */}
            <Dialog open={isAddDishModalOpen} onOpenChange={setIsAddDishModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Добавить блюдо</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Прием пищи</Label>
                            <Select value={selectedMealTypeToAdd} onValueChange={setSelectedMealTypeToAdd}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(MEAL_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Блюдо</Label>
                            <Select value={selectedDishToAdd} onValueChange={setSelectedDishToAdd}>
                                <SelectTrigger><SelectValue placeholder="Поиск..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {getAllDishes().filter(d => d.mealType === selectedMealTypeToAdd).map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
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

            {/* Edit Ingredients Modal - Same as before but uses local state */}
            <Dialog open={isEditDishModalOpen} onOpenChange={setIsEditDishModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Ингредиенты: {editingDish?.dish.dishName}</DialogTitle>
                    </DialogHeader>
                    {editingDish && (
                        <div className="flex-1 overflow-auto py-2">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Название</TableHead><TableHead>Кол-во</TableHead><TableHead>Ед.</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(editingDish.dish.customIngredients || getOriginalIngredients(editingDish.dish.dishId)).map((ing, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{ing.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number" className="h-8 w-24"
                                                    value={ing.amount}
                                                    onChange={(e) => {
                                                        const newVal = parseFloat(e.target.value) || 0;
                                                        const currentIngredients = editingDish.dish.customIngredients
                                                            ? [...editingDish.dish.customIngredients]
                                                            : [...getOriginalIngredients(editingDish.dish.dishId)];
                                                        currentIngredients[idx] = { ...currentIngredients[idx], amount: newVal };
                                                        setEditingDish({
                                                            ...editingDish,
                                                            dish: { ...editingDish.dish, customIngredients: currentIngredients }
                                                        });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{ing.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={updateEditingDish}>Сохранить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
