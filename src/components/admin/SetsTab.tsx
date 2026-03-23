'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Plus,
    Trash2,
    Edit,
    UtensilsCrossed,
    Flame,
    Copy,
    Scale,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchPanel } from '@/components/ui/search-panel';
import { IconButton } from '@/components/ui/icon-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils'
import { MENUS, MEAL_TYPES, type Dish, type Ingredient } from '@/lib/menuData';

// Types for custom sets
// Types for custom sets
interface SetDish {
    dishId: string | number; // Support CUIDs from DB and legacy numeric IDs
    dishName: string;
    mealType: string;
    mealIndex?: number | null;
    customIngredients?: Ingredient[];
}

interface CalorieGroup {
    id?: string; // stable key inside JSON
    name?: string;
    price?: number | null;
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
const DEFAULT_MAX_DAYS = 60;
const MEAL_TYPE_ORDER: Array<keyof typeof MEAL_TYPES> = [
    'BREAKFAST',
    'SECOND_BREAKFAST',
    'LUNCH',
    'SNACK',
    'DINNER',
    'SIXTH_MEAL',
];

function getMealIndex(mealType: string) {
    const idx = MEAL_TYPE_ORDER.indexOf(mealType as any);
    return idx >= 0 ? idx + 1 : null;
}

export function SetsTab() {
    const { language } = useLanguage();

    const uiText = useMemo(() => {
        if (language === 'uz') {
            return {
                title: 'Setlar',
                subtitle: 'Menuni kunlar bo‘yicha sozlash',
                newSet: 'Yangi set',
                newDish: 'Yangi taom',
                setsList: 'Setlar ro‘yxati',
                updatedAt: 'Yangilandi',
                search: 'Qidirish',
                selectSetHint: 'Tahrirlashni boshlash uchun setni tanlang',
                days: 'Kunlar',
                dayMenuTitle: (day: string) => `Kun ${day} menyusi`,
                noDayDataTitle: 'Bu kun uchun menyu yo‘q',
                noDayDataDesc: (day: string) => `Siz bo‘shdan boshlashingiz yoki ${day}-kun uchun standart menyuni nusxalashingiz mumkin.`,
                copyStandard: (day: string) => `Standart menyuni nusxalash (Kun ${day})`,
                copiedDay: (day: string) => `Kun ${day} menyusi nusxalandi`,
                confirmDeleteSet: 'Ushbu setni o‘chirasizmi?',
                deleted: 'O‘chirildi',
                delete: 'O‘chirish',
                saveError: 'Saqlashda xatolik',
                loadSetsError: 'Setlarni yuklashda xatolik',
                loadDishesError: 'Taomlarni yuklashda xatolik',
                setNameRequired: 'Set nomini kiriting',
                confirmDeleteDay: (day: string) => `Kun ${day} ni oâ€˜chirasizmi?`,
                confirmDeleteGroup: 'Ushbu guruhni oâ€˜chirasizmi?',
                cantDeleteLastDay: 'Oxirgi kunni oâ€˜chirib boâ€˜lmaydi',
                create: 'Yaratish',
                cancel: 'Bekor qilish',
                setName: 'Set nomi',
                mealName: 'Taom nomi',
                mealNamePlaceholder: 'Taom nomini yozing...',
                mealNameRequired: 'Taom nomini kiriting',
                dish: 'Taom',
                meal: 'Ovqat',
                addMeal: 'Taom qo‘shish',
                editMeal: 'Taomni tahrirlash',
                noDishes: 'Taomlar yo‘q',
                customWeight: 'Moslashtirilgan vazn',
                standard: 'Standart',
                addIngredient: 'Ingredient qo‘shish',
                selectIngredient: 'Ingredient tanlang...',
                ingredients: 'Ingredientlar',
                ingredientsDesc: 'Bu taom uchun ingredientlar tarkibini va og‘irligini sozlang.',
                tableName: 'Nomi',
                tableAmount: 'Miqdor',
                tableUnit: 'Birlik',
                noIngredients: 'Ingredient yo‘q',
                ingredientAlreadyAdded: 'Ingredient allaqachon qo‘shilgan',
                saveChanges: 'O‘zgarishlarni saqlash',
                groups: 'Guruhlar',
                group: 'Guruh',
                newGroup: 'Yangi guruh',
                groupName: 'Guruh nomi',
                groupCalories: 'Kaloriya (kcal)',
                groupPrice: 'Narx',
                mealLabel: (n: number) => `${n}-taom`,
                menuDay: (day: string) => `Menyu ${day}`,
                addDay: 'Kun qo‘shish',
                maxDaysReached: (n: number) => `Maksimal kunlar: ${n}`,
            };
        }

        if (language === 'ru') {
            return {
                title: 'Сеты',
                subtitle: 'Настройка меню по дням',
                newSet: 'Новый сет',
                newDish: 'Новое блюдо',
                setsList: 'Список сетов',
                updatedAt: 'Обновлено',
                search: 'Поиск',
                selectSetHint: 'Выберите сет, чтобы начать редактирование',
                days: 'Дни',
                dayMenuTitle: (day: string) => `Меню на День ${day}`,
                noDayDataTitle: 'Нет меню для этого дня',
                noDayDataDesc: (day: string) => `Вы можете начать с чистого листа или скопировать стандартное меню для Дня ${day}.`,
                copyStandard: (day: string) => `Скопировать стандартное меню (День ${day})`,
                copiedDay: (day: string) => `Меню дня ${day} скопировано`,
                confirmDeleteSet: 'Удалить этот сет?',
                deleted: 'Удалено',
                delete: 'Удалить',
                saveError: 'Ошибка сохранения',
                loadSetsError: 'Ошибка загрузки сетов',
                loadDishesError: 'Ошибка загрузки блюд',
                setNameRequired: 'Введите название сета',
                confirmDeleteDay: (day: string) => `Удалить День ${day}?`,
                confirmDeleteGroup: 'Удалить эту группу?',
                cantDeleteLastDay: 'Нельзя удалить последний день',
                create: 'Создать',
                cancel: 'Отмена',
                setName: 'Название сета',
                mealName: 'Название блюда',
                mealNamePlaceholder: 'Введите название блюда...',
                mealNameRequired: 'Введите название блюда',
                dish: 'Блюдо',
                meal: 'Приём пищи',
                addMeal: 'Добавить блюдо',
                editMeal: 'Редактировать блюдо',
                noDishes: 'Нет блюд',
                customWeight: 'Кастомный вес',
                standard: 'Стандарт',
                addIngredient: 'Добавить ингредиент',
                selectIngredient: 'Выберите ингредиент...',
                ingredients: 'Ингредиенты',
                ingredientsDesc: 'Настройте состав и вес ингредиентов для этого блюда в рамках сета.',
                tableName: 'Название',
                tableAmount: 'Кол-во',
                tableUnit: 'Ед.',
                noIngredients: 'Нет ингредиентов',
                ingredientAlreadyAdded: 'Ингредиент уже добавлен',
                saveChanges: 'Сохранить изменения',
                groups: 'Группы',
                group: 'Группа',
                newGroup: 'Новая группа',
                groupName: 'Название группы',
                groupCalories: 'Калории (kcal)',
                groupPrice: 'Цена',
                mealLabel: (n: number) => `Приём ${n}`,
                menuDay: (day: string) => `Меню ${day}`,
                addDay: 'Добавить день',
                maxDaysReached: (n: number) => `Максимум дней: ${n}`,
            };
        }

        return {
            title: 'Sets',
            subtitle: 'Configure menus by day',
            newSet: 'New set',
            newDish: 'New dish',
            setsList: 'Sets list',
            updatedAt: 'Updated',
            search: 'Search',
            selectSetHint: 'Select a set to start editing',
            days: 'Days',
            dayMenuTitle: (day: string) => `Day ${day} menu`,
            noDayDataTitle: 'No menu for this day',
            noDayDataDesc: (day: string) => `Start from scratch or copy the standard menu for Day ${day}.`,
            copyStandard: (day: string) => `Copy standard menu (Day ${day})`,
            copiedDay: (day: string) => `Copied menu for Day ${day}`,
            confirmDeleteSet: 'Delete this set?',
            deleted: 'Deleted',
            delete: 'Delete',
            saveError: 'Save error',
            loadSetsError: 'Failed to load sets',
            loadDishesError: 'Failed to load dishes',
             setNameRequired: 'Enter set name',
             confirmDeleteDay: (day: string) => `Delete Day ${day}?`,
             confirmDeleteGroup: 'Delete this group?',
             cantDeleteLastDay: 'Cannot delete the last day',
             create: 'Create',
             cancel: 'Cancel',
             setName: 'Set name',
            mealName: 'Meal name',
            mealNamePlaceholder: 'Type a meal name...',
            mealNameRequired: 'Enter meal name',
            dish: 'Dish',
            meal: 'Meal',
            addMeal: 'Add meal',
            editMeal: 'Edit meal',
            noDishes: 'No dishes',
            customWeight: 'Custom weight',
            standard: 'Standard',
            addIngredient: 'Add ingredient',
            selectIngredient: 'Select an ingredient...',
            ingredients: 'Ingredients',
            ingredientsDesc: 'Adjust ingredients and amounts for this meal inside the set.',
            tableName: 'Name',
            tableAmount: 'Qty',
            tableUnit: 'Unit',
            noIngredients: 'No ingredients',
            ingredientAlreadyAdded: 'Ingredient already added',
            saveChanges: 'Save changes',
            groups: 'Groups',
            group: 'Group',
            newGroup: 'New group',
            groupName: 'Group name',
            groupCalories: 'Calories (kcal)',
            groupPrice: 'Price',
            mealLabel: (n: number) => `Meal ${n}`,
            menuDay: (day: string) => `Menu ${day}`,
            addDay: 'Add day',
            maxDaysReached: (n: number) => `Max days: ${n}`,
        };
    }, [language]);

    // Keep Sets + Days selector rows visually consistent.
    const rowIconBtnClass = "h-9 w-9";
    const rowIconBtnGhostClass = `${rowIconBtnClass} text-slate-200 hover:text-white hover:bg-slate-700`;
    const rowIconBtnDeleteClass = `${rowIconBtnClass} text-red-200 hover:text-white hover:bg-red-600/30`;

    type CalorieGroupsMeta = {
        dayOrder?: string[];
        groupOrder?: string[];
    };

    const [sets, setSets] = useState<MenuSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<MenuSet | null>(null);
    const [activeDay, setActiveDay] = useState<string>("1"); // Current day being edited (1-21)
    const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
    const [warehouseItems, setWarehouseItems] = useState<Array<{ name: string; unit?: string; kcalPerGram?: number | null }>>([]);
    const [setSearch, setSetSearch] = useState('');

    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
    const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State
    const [activeGroupTab, setActiveGroupTab] = useState('');
    const [addDishTarget, setAddDishTarget] = useState<{ calorieIndex: number } | null>(null);
    const [selectedDishToAdd, setSelectedDishToAdd] = useState<string>('');
    const [mealNameToAdd, setMealNameToAdd] = useState('');
    const [draftMealIngredients, setDraftMealIngredients] = useState<Ingredient[]>([]);
    const [editingDish, setEditingDish] = useState<{ setId: string; calorieIndex: number; dishIndex: number; dish: SetDish } | null>(null);
    const [editingGroup, setEditingGroup] = useState<{ groupIndex: number; group: CalorieGroup } | null>(null);

    // Form state for new set
    const [newSetForm, setNewSetForm] = useState({
        name: '',
        description: ''
    });

    const [groupForm, setGroupForm] = useState<{ name: string; price: string }>({
        name: '',
        price: '',
    });

    const [setsOrder, setSetsOrder] = useState<string[]>([]);

    // Load sets and dishes
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchSets(), fetchDishes(), fetchWarehouseItems()]);
            setIsLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('warehouse_sets_order_v1');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setSetsOrder(parsed.filter((v) => typeof v === 'string'));
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (!sets || sets.length === 0) return;
        setSetsOrder((prev) => {
            const known = new Set(prev);
            const next = [...prev];
            for (const s of sets) {
                if (!known.has(s.id)) next.push(s.id);
            }
            try {
                localStorage.setItem('warehouse_sets_order_v1', JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, [sets]);

    const getMeta = (set: MenuSet | null): CalorieGroupsMeta => {
        const base = set?.calorieGroups as any;
        if (!base || typeof base !== 'object' || Array.isArray(base)) return {};
        const meta = base._meta;
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
        return meta as CalorieGroupsMeta;
    };

    const getBaseGroups = (set: MenuSet | null) => {
        const base =
            set?.calorieGroups && !Array.isArray(set.calorieGroups)
                ? (set.calorieGroups as any)
                : {};
        return base;
    };

    const getDayKeysFromGroups = (groups: any) => {
        return Object.keys(groups || {})
            .filter((k) => /^\d+$/.test(k))
            .map((k) => String(parseInt(k, 10)))
            .filter((k) => k !== 'NaN' && Number(k) > 0);
    };

    const moveInArray = <T,>(arr: T[], from: number, to: number) => {
        if (from === to) return arr;
        if (from < 0 || from >= arr.length) return arr;
        if (to < 0 || to >= arr.length) return arr;
        const next = [...arr];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
    };

    const fetchSets = async () => {
        try {
            const response = await fetch('/api/admin/sets');
            if (response.ok) {
                const data = await response.json();

                if (data.length === 0) {
                    await createDefaultSet();
                } else {
                    setSets(data);
                    if (!selectedSet) {
                        // Prefer active set, otherwise first
                        const active = data.find((s: MenuSet) => s.isActive);
                        setSelectedSet(active || data[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching sets:', error);
            toast.error(uiText.loadSetsError);
        }
    };

    const createDefaultSet = async () => {
        try {
            const defaultName =
                language === 'ru' ? 'Стандартный сет' :
                    language === 'uz' ? 'Standart set' :
                        'Default set';
            const defaultDesc =
                language === 'ru' ? 'Автоматически созданный сет' :
                    language === 'uz' ? 'Avtomatik yaratilgan set' :
                        'Auto-created default set';
            const response = await fetch('/api/admin/sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: defaultName,
                    description: defaultDesc
                })
            });

            if (response.ok) {
                const newSet = await response.json();
                setSets([newSet]);
                setSelectedSet(newSet);
                toast.success(defaultName);
            }
        } catch (e) {
            console.error('Failed to create default set', e);
        }
    };

    const fetchDishes = async () => {
        try {
            const response = await fetch('/api/admin/warehouse/dishes');
            if (response.ok) {
                const data = await response.json();
                // Ensure IDs are strings to match our selection state naturally, or keep as is.
                // The DB returns objects. id might be string or number (if we seeded as "1").
                // Let's use them as is but treat IDs flexibly.
                setAvailableDishes(data);
            }
        } catch (error) {
            console.error('Error fetching dishes:', error);
            toast.error(uiText.loadDishesError);
        }
    };

    const fetchWarehouseItems = async () => {
        try {
            const response = await fetch('/api/admin/warehouse/ingredients');
            if (response.ok) {
                const data = await response.json();
                setWarehouseItems(Array.isArray(data) ? data : []);
            }
        } catch {
            // calorie totals are best-effort; ignore loading failures here
            setWarehouseItems([]);
        }
    };

    const normalizeName = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();

    const normalizeIngredients = (raw: any): Ingredient[] => {
        if (!Array.isArray(raw)) return [];
        return raw
            .map((i) => ({
                name: typeof i?.name === 'string' ? i.name : '',
                amount: typeof i?.amount === 'number' && Number.isFinite(i.amount) ? i.amount : Number(i?.amount) || 0,
                unit: typeof i?.unit === 'string' ? i.unit : 'gr',
            }))
            .filter((i) => i.name.trim().length > 0);
    };

    const resetAddMealDraft = () => {
        setSelectedDishToAdd('');
        setMealNameToAdd('');
        setDraftMealIngredients([]);
    };

    const selectDishForAdd = (dish: any) => {
        setSelectedDishToAdd(String(dish?.id ?? ''));
        setMealNameToAdd(String(dish?.name ?? ''));
        setDraftMealIngredients(normalizeIngredients(dish?.ingredients));
    };

    const addDraftIngredient = (name: string) => {
        const trimmed = String(name || '').trim();
        if (!trimmed) return;
        if (draftMealIngredients.find((i) => i.name === trimmed)) {
            toast.error(uiText.ingredientAlreadyAdded);
            return;
        }
        const found = getAllUniqueIngredients().find((i) => i.name === trimmed);
        setDraftMealIngredients((prev) => [
            ...prev,
            { name: trimmed, amount: 0, unit: found?.unit || 'gr' },
        ]);
    };

    const removeDraftIngredient = (index: number) => {
        setDraftMealIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const updateDraftIngredientAmount = (index: number, amount: number) => {
        setDraftMealIngredients((prev) =>
            prev.map((ing, i) => (i === index ? { ...ing, amount } : ing))
        );
    };

    const createSet = async () => {
        if (!newSetForm.name.trim()) {
            toast.error(uiText.setNameRequired);
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
                toast.success(uiText.create);
            } else {
                toast.error(uiText.saveError);
            }
        } catch {
            toast.error(uiText.saveError);
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
    const buildStandardDayData = (dayNum: number): CalorieGroup[] | null => {
        const menuNumber = ((dayNum - 1) % 21) + 1;
        const menuData = MENUS.find(m => m.menuNumber === menuNumber);
        if (!menuData) return null;

        return CALORIE_OPTIONS.map((calories) => ({
            id: String(calories),
            calories,
            name: `${calories} kcal`,
            price: null,
            dishes: menuData.dishes.map((dish) => ({
                dishId: dish.id,
                dishName: dish.name,
                mealType: dish.mealType,
                customIngredients: undefined,
            })),
        }));
    };

    const copyStandardMenuToDay = async () => {
        if (!selectedSet) return;

        const dayNum = parseInt(activeDay);
        const newDayData = buildStandardDayData(dayNum);

        if (!newDayData) {
            toast.error(uiText.noDayDataTitle);
            return;
        }

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
        toast.success(uiText.copiedDay(activeDay));
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
            toast.error(uiText.saveError);
        }
    };

    useEffect(() => {
        if (!isGroupModalOpen) return;

        if (editingGroup) {
            setGroupForm({
                name: editingGroup.group.name || '',
                price: typeof editingGroup.group.price === 'number' ? String(editingGroup.group.price) : '',
            });
            return;
        }

        setGroupForm({ name: '', price: '' });
    }, [editingGroup, isGroupModalOpen]);

    const makeGroupId = () => {
        try {
            const id = (globalThis as any)?.crypto?.randomUUID?.();
            if (typeof id === 'string' && id.length > 0) return id;
        } catch {
            // ignore
        }
        return `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    };

    const upsertGroup = async () => {
        if (!selectedSet) return;

        const baseGroups = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);

        const name = (groupForm.name || '').trim();
        const price = groupForm.price.trim() === '' ? null : Number(groupForm.price);
        const calories =
            typeof editingGroup?.group?.calories === 'number' && Number.isFinite(editingGroup.group.calories)
                ? editingGroup.group.calories
                : 0;

        const nextId = editingGroup?.group?.id || makeGroupId();

        const dayKeys = getDayKeysFromGroups(baseGroups);
        const ensuredKeys = dayKeys.length > 0 ? dayKeys : Array.from({ length: 21 }, (_, i) => String(i + 1));

        const nextGroups: Record<string, CalorieGroup[]> = {};
        for (const dayKey of ensuredKeys) {
            const dayArr: CalorieGroup[] = Array.isArray(baseGroups[dayKey]) ? baseGroups[dayKey] : [];

            if (editingGroup) {
                nextGroups[dayKey] = dayArr.map((g) => (g.id === nextId ? { ...g, id: nextId, name, calories, price, dishes: g.dishes || [] } : g));
            } else {
                nextGroups[dayKey] = [
                    ...dayArr,
                    { id: nextId, name, calories, price, dishes: [] },
                ];
            }
        }
        nextGroups._meta = {
            ...meta,
            groupOrder: (() => {
                const existing = Array.isArray(meta.groupOrder) ? meta.groupOrder.map(String) : [];
                if (existing.includes(String(nextId))) return existing;
                return [...existing, String(nextId)];
            })(),
        } as any;

        const updatedSet = { ...selectedSet, calorieGroups: nextGroups };
        setSelectedSet(updatedSet);
        setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)));
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        await saveSet(updatedSet);
        toast.success(uiText.saveChanges);
    };

    // CRUD Operations for Dishes (similar to before but aware of Day structure)

    // Ingredient Management
    const getAllUniqueIngredients = () => {
        const ingredients = new Map<string, string>(); // name -> unit
        availableDishes.forEach(d => {
            d.ingredients?.forEach(i => ingredients.set(i.name, i.unit));
        });
        // Also include warehouse items so managers can add any newly created ingredient.
        warehouseItems.forEach((item) => {
            const name = typeof item?.name === 'string' ? item.name.trim() : '';
            if (!name) return;
            ingredients.set(name, item.unit || 'gr');
        });
        return Array.from(ingredients.entries()).map(([name, unit]) => ({ name, unit })).sort((a, b) => a.name.localeCompare(b.name));
    };

    const removeIngredient = (index: number) => {
        if (!editingDish) return;
        const currentIngredients = editingDish.dish.customIngredients
            ? [...editingDish.dish.customIngredients]
            : [...getOriginalIngredients(editingDish.dish.dishId)];

        currentIngredients.splice(index, 1);

        setEditingDish({
            ...editingDish,
            dish: { ...editingDish.dish, customIngredients: currentIngredients }
        });
    };

    const addIngredient = (name: string) => {
        if (!editingDish) return;
        const currentIngredients = editingDish.dish.customIngredients
            ? [...editingDish.dish.customIngredients]
            : [...getOriginalIngredients(editingDish.dish.dishId)];

        if (currentIngredients.find(i => i.name === name)) {
            toast.error(uiText.ingredientAlreadyAdded);
            return;
        }

        const allIngs = getAllUniqueIngredients();
        const found = allIngs.find(i => i.name === name);

        currentIngredients.push({
            name,
            amount: 0,
            unit: found?.unit || 'gr'
        });

        setEditingDish({
            ...editingDish,
            dish: { ...editingDish.dish, customIngredients: currentIngredients }
        });
    };

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
        toast.success(uiText.saveChanges);
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
        if (!selectedSet || !addDishTarget) return;

        const enteredName = mealNameToAdd.trim();
        if (!enteredName) {
            toast.error(uiText.mealNameRequired);
            return;
        }

        // Prefer explicitly selected dish; fallback to exact-name match.
        let dishObj: any =
            selectedDishToAdd
                ? availableDishes.find(d => String((d as any).id) === selectedDishToAdd)
                : availableDishes.find(d => normalizeName(String((d as any).name || '')) === normalizeName(enteredName));

        const ingredientsToUse =
            draftMealIngredients.length > 0
                ? draftMealIngredients
                : (dishObj ? normalizeIngredients((dishObj as any).ingredients) : []);

        if (!dishObj) {
            try {
                const response = await fetch('/api/admin/warehouse/dishes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: enteredName,
                        description: '',
                        mealType: 'CUSTOM',
                        ingredients: ingredientsToUse,
                        menuNumbers: [],
                    }),
                });

                if (!response.ok) {
                    toast.error(uiText.saveError);
                    return;
                }

                dishObj = await response.json().catch(() => null);
                await fetchDishes();
            } catch {
                toast.error(uiText.saveError);
                return;
            }
        }

        if (!dishObj) {
            toast.error(uiText.saveError);
            return;
        }

        const currentData = getCurrentDayData();

        // If empty, init it first? But copyStandardMenuToDay handles bulk init.
        // Assuming array exists if we are adding via button which is inside tab content

        const updatedDayData = [...currentData];
        if (updatedDayData.length === 0) {
            // Edge case: empty day, user clicks add manually without copying
            // Initialize structure
            updatedDayData.push(...CALORIE_OPTIONS.map(c => ({ id: String(c), calories: c, name: `${c} kcal`, price: null, dishes: [] })));
        }

        updatedDayData[addDishTarget.calorieIndex] = {
            ...updatedDayData[addDishTarget.calorieIndex],
            dishes: [...updatedDayData[addDishTarget.calorieIndex].dishes]
        };

        const dishesArr = updatedDayData[addDishTarget.calorieIndex].dishes;
        const maxMealIndex = dishesArr.reduce((acc, d) => {
            const n = typeof (d as any).mealIndex === 'number' ? (d as any).mealIndex : 0;
            return Math.max(acc, Number.isFinite(n) ? n : 0);
        }, 0);
        const mealIndex = maxMealIndex + 1;

        dishesArr.push({
            dishId: (dishObj as any).id,
            dishName: String((dishObj as any).name || enteredName),
            mealType: String((dishObj as any).mealType || 'CUSTOM'),
            mealIndex,
            customIngredients: ingredientsToUse.length > 0 ? [...ingredientsToUse] : undefined
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
        resetAddMealDraft();

        await saveSet(updatedSet);
        toast.success(uiText.addMeal);
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
                    setSelectedSet({ ...selectedSet, ...updated });
                }

                toast.success(uiText.saveChanges);
            }
        } catch { toast.error(uiText.saveError); }
    };

    const deleteSet = async (id: string) => {
        if (!confirm(uiText.confirmDeleteSet)) return;
        await fetch(`/api/admin/sets/${id}`, { method: 'DELETE' });
        setSets((prev) => {
            const next = prev.filter((s) => s.id !== id);
            if (selectedSet?.id === id) {
                setSelectedSet(next[0] || null);
                setActiveDay('1');
                setActiveGroupTab('');
            }
            return next;
        });
        toast.success(uiText.deleted);
    };

    const getOriginalIngredients = (dishId: string | number): Ingredient[] => {
        // Try to find in availableDishes first (from DB)
        let dish = availableDishes.find(d => d.id == dishId); // Use loose equality for string/number compatibility

        // Fallback to static MENUS if not found or availableDishes is empty
        if (!dish && MENUS) {
            for (const menu of MENUS) {
                const found = menu.dishes.find(d => d.id == dishId);
                if (found) {
                    dish = found;
                    break;
                }
            }
        }

        return dish?.ingredients || [];
    };

    const kcalPerGramByName = useMemo(() => {
        const m = new Map<string, number>();
        for (const item of warehouseItems) {
            const name = typeof item?.name === 'string' ? item.name.trim().toLowerCase() : '';
            const kcal = typeof item?.kcalPerGram === 'number' && Number.isFinite(item.kcalPerGram) ? item.kcalPerGram : null;
            if (!name || kcal === null) continue;
            m.set(name, kcal);
        }
        return m;
    }, [warehouseItems]);

    const toGrams = (amount: number, unit: string) => {
        const a = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
        const u = (unit || '').toLowerCase().trim();
        if (!a) return 0;
        if (u === 'kg') return a * 1000;
        if (u === 'g' || u === 'gr' || u === 'гр') return a;
        if (u === 'mg') return a / 1000;
        // Best-effort for liquids/pcs: treat as grams to still show a useful total.
        return a;
    };

    const formatUzs = (value: number) => {
        const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(v));
    };

    // Compact format for tight labels (e.g. group tabs): 84000 -> "84k".
    const formatUzsCompact = (value: number) => {
        const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
        return String(Math.round(v));
    };

    const getDishCalories = (dish: SetDish) => {
        const ingredients = dish.customIngredients ? dish.customIngredients : getOriginalIngredients(dish.dishId);
        let total = 0;
        for (const ing of ingredients || []) {
            const nameKey = (ing.name || '').trim().toLowerCase();
            const kcalPerGram = kcalPerGramByName.get(nameKey) ?? 0;
            total += toGrams(Number(ing.amount), String(ing.unit)) * kcalPerGram;
        }
        return Number.isFinite(total) ? total : 0;
    };

    const getGroupCaloriesTotal = (group: CalorieGroup | null | undefined) => {
        if (!group || !Array.isArray(group.dishes)) return 0;
        let total = 0;
        for (const d of group.dishes) total += getDishCalories(d);
        return Number.isFinite(total) ? total : 0;
    };

    const visibleSets = useMemo(() => {
        const q = setSearch.trim().toLowerCase();
        const filtered = !q ? sets : sets.filter((s) => (s.name || '').toLowerCase().includes(q));

        if (!setsOrder || setsOrder.length === 0) return filtered;
        const idx = new Map<string, number>();
        setsOrder.forEach((id, i) => idx.set(id, i));
        return filtered.slice().sort((a, b) => {
            const aI = idx.has(a.id) ? (idx.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
            const bI = idx.has(b.id) ? (idx.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
            if (aI !== bI) return aI - bI;
            // Stable fallback: keep API order (createdAt desc)
            return 0;
        });
    }, [setSearch, sets, setsOrder]);

    const currentDayDataRaw = getCurrentDayData();
    const currentDayData = useMemo(() => {
        return (currentDayDataRaw || []).map((g, idx) => ({
            ...g,
            id: g.id || String(g.calories ?? idx),
            price: typeof g.price === 'number' ? g.price : (g.price ?? null),
        }));
    }, [currentDayDataRaw]);
    const hasDataForDay = currentDayData.length > 0;

    const activeDayGroup = useMemo(() => {
        if (!activeGroupTab) return null;
        return currentDayData.find((g) => String(g.id) === String(activeGroupTab)) ?? null;
    }, [activeGroupTab, currentDayData]);

    const dayKeys = useMemo(() => {
        if (!selectedSet || !selectedSet.calorieGroups || Array.isArray(selectedSet.calorieGroups)) {
            return Array.from({ length: 21 }, (_, i) => String(i + 1));
        }

        const base = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);
        const existing = getDayKeysFromGroups(base).sort((a, b) => Number(a) - Number(b));
        if (existing.length === 0) return Array.from({ length: 21 }, (_, i) => String(i + 1));

        const order = Array.isArray(meta.dayOrder) ? meta.dayOrder.map(String) : [];
        if (order.length === 0) return existing;

        // Keep only existing keys, preserve order, then append any missing.
        const existingSet = new Set(existing);
        const next: string[] = [];
        for (const k of order) if (existingSet.has(k)) next.push(k);
        for (const k of existing) if (!next.includes(k)) next.push(k);
        return next;
    }, [selectedSet]);

    const deleteDay = async (dayKey: string) => {
        if (!selectedSet) return;
        if (dayKeys.length <= 1) {
            toast.error(uiText.cantDeleteLastDay);
            return;
        }
        if (!confirm(uiText.confirmDeleteDay(dayKey))) return;

        const baseGroups = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);

        const nextGroups = { ...baseGroups };
        delete nextGroups[String(dayKey)];
        // Keep meta consistent.
        const nextMeta: CalorieGroupsMeta = {
            ...meta,
            dayOrder: Array.isArray(meta.dayOrder) ? meta.dayOrder.filter((k) => String(k) !== String(dayKey)) : undefined,
        };
        nextGroups._meta = nextMeta;

        const updatedSet = { ...selectedSet, calorieGroups: nextGroups };
        setSelectedSet(updatedSet);
        setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)));

        const remainingDays = dayKeys.filter((d) => String(d) !== String(dayKey));
        const nextActive = remainingDays.length > 0 ? String(remainingDays[0]) : '1';
        setActiveDay(nextActive);

        await saveSet(updatedSet);
        toast.success(uiText.deleted);
    };

    const deleteGroupById = async (groupId: string) => {
        if (!selectedSet) return;
        if (!groupId) return;
        if (!confirm(uiText.confirmDeleteGroup)) return;

        const baseGroups = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);

        const nextGroups: Record<string, CalorieGroup[]> = {};
        for (const dayKey of getDayKeysFromGroups(baseGroups)) {
            const dayArr: CalorieGroup[] = Array.isArray(baseGroups[dayKey]) ? baseGroups[dayKey] : [];
            nextGroups[dayKey] = dayArr.filter((g) => (g.id || String(g.calories ?? '')) !== groupId);
        }
        nextGroups._meta = {
            ...meta,
            groupOrder: Array.isArray(meta.groupOrder) ? meta.groupOrder.filter((id) => String(id) !== String(groupId)) : undefined,
        } as any;

        const updatedSet = { ...selectedSet, calorieGroups: nextGroups };
        setSelectedSet(updatedSet);
        setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)));

        setActiveGroupTab((prev) => {
            if (prev !== groupId) return prev;
            const forActiveDay = nextGroups[String(activeDay)] || [];
            const ensured = forActiveDay.map((g, idx) => ({ ...g, id: g.id || String(g.calories ?? idx) }));
            return ensured[0]?.id || '';
        });

        await saveSet(updatedSet);
        toast.success(uiText.deleted);
    };

    const moveSelectedSet = (dir: -1 | 1) => {
        if (!selectedSet) return;
        setSetsOrder((prev) => {
            const order = prev.length > 0 ? [...prev] : sets.map((s) => s.id);
            const idx = order.indexOf(selectedSet.id);
            if (idx === -1) return prev;
            const next = moveInArray(order, idx, idx + dir);
            try {
                localStorage.setItem('warehouse_sets_order_v1', JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const moveSelectedDay = async (dir: -1 | 1) => {
        if (!selectedSet) return;
        const baseGroups = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);
        const existing = getDayKeysFromGroups(baseGroups);
        const order = Array.isArray(meta.dayOrder) && meta.dayOrder.length > 0 ? meta.dayOrder.map(String) : dayKeys.slice();
        const cleaned = order.filter((k) => existing.includes(String(k)));
        const idx = cleaned.indexOf(String(activeDay));
        if (idx === -1) return;
        const nextOrder = moveInArray(cleaned, idx, idx + dir);

        const nextGroups = { ...baseGroups, _meta: { ...meta, dayOrder: nextOrder } };
        const updatedSet = { ...selectedSet, calorieGroups: nextGroups as any };
        setSelectedSet(updatedSet);
        setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)));
        await saveSet(updatedSet);
    };

    const moveSelectedGroup = async (dir: -1 | 1) => {
        if (!selectedSet) return;
        if (!activeGroupTab) return;
        const baseGroups = getBaseGroups(selectedSet);
        const meta = getMeta(selectedSet);

        const existingDayKeys = getDayKeysFromGroups(baseGroups);
        const current = currentDayData.map((g) => String(g.id));
        const order = Array.isArray(meta.groupOrder) && meta.groupOrder.length > 0 ? meta.groupOrder.map(String) : current;
        const cleaned = order.filter((id) => current.includes(String(id)));
        const idx = cleaned.indexOf(String(activeGroupTab));
        if (idx === -1) return;
        const nextOrder = moveInArray(cleaned, idx, idx + dir);

        const reorderDay = (arr: CalorieGroup[]) => {
            const withIds = (arr || []).map((g, idx) => ({ ...g, id: g.id || String(g.calories ?? idx) }));
            const map = new Map(withIds.map((g) => [String(g.id), g]));
            const next: CalorieGroup[] = [];
            for (const id of nextOrder) {
                const g = map.get(String(id));
                if (g) next.push(g);
            }
            for (const g of withIds) {
                if (!next.find((x) => String((x as any).id) === String((g as any).id))) next.push(g);
            }
            return next;
        };

        const nextGroups: any = {};
        for (const dayKey of existingDayKeys) {
            nextGroups[dayKey] = reorderDay(Array.isArray(baseGroups[dayKey]) ? baseGroups[dayKey] : []);
        }
        nextGroups._meta = { ...meta, groupOrder: nextOrder };

        const updatedSet = { ...selectedSet, calorieGroups: nextGroups };
        setSelectedSet(updatedSet);
        setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)));
        await saveSet(updatedSet);
    };

    useEffect(() => {
        if (!hasDataForDay) return;
        if (currentDayData.some((g) => g.id === activeGroupTab)) return;
        setActiveGroupTab(currentDayData[0]?.id || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDay, hasDataForDay, currentDayData]);

    if (isLoading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent mx-auto"></div></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-card p-6 rounded-[32px] border-2 border-dashed border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                <div className="min-w-0 z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                        <UtensilsCrossed className="w-8 h-8 text-primary" />
                        {uiText.title}
                    </h2>
                    <p className="text-sm text-muted-foreground/60 font-bold uppercase tracking-widest mt-1">{uiText.subtitle}</p>
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto z-10">
                    <SearchPanel
                        value={setSearch}
                        onChange={setSetSearch}
                        placeholder={uiText.search}
                        className="w-full sm:w-[260px] md:w-[320px] flex-none basis-full sm:basis-auto rounded-full border-2 border-dashed"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {/* Sets Selector Row */}
                <div className="rounded-[32px] border-2 border-dashed border-border bg-card/60 backdrop-blur-xl p-4 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 min-w-max pb-2">
                            <span className="text-xs font-black uppercase tracking-widest px-4 text-muted-foreground/60 flex items-center gap-2 bg-muted/30 rounded-full h-10">
                                <Scale className="w-4 h-4" />
                                {uiText.setsList}
                            </span>

                            {visibleSets.map((set) => {
                                const isSelected = selectedSet?.id === set.id;
                                return (
                                    <Button
                                        key={set.id}
                                        type="button"
                                        onClick={() => setSelectedSet(set)}
                                        size="refSm"
                                        variant={isSelected ? "default" : "ghost"}
                                        className={cn(
                                            "min-w-[140px] max-w-[220px] justify-between gap-3 !border-2",
                                            isSelected ? "border-primary text-white shadow-lg scale-105" : "bg-white/40 dark:bg-muted/40 border-dashed border-border/50 hover:border-primary/40 hover:bg-muted/60 text-foreground",
                                        )}
                                        title={set.name}
                                    >
                                        <span className="truncate text-sm flex-1 text-left">{set.name}</span>
                                        <span
                                            className={[
                                                "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-all",
                                                set.isActive ? "bg-emerald-500 shadow-emerald-500/40" : "bg-slate-300 dark:bg-slate-600",
                                            ].join(" ")}
                                        />
                                    </Button>
                                );
                            })}

                            <div className="flex items-center gap-1 ml-4 border-l-2 border-dashed border-border pl-4">
                                <IconButton
                                    label={uiText.newSet}
                                    variant="outline"
                                    iconSize="md"
                                    className="h-[50px] w-[50px] rounded-full border-b-4 border-black/10 border-2 border-dashed bg-white/50 text-foreground hover:bg-muted"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                </IconButton>

                                <IconButton
                                    label={uiText.delete}
                                    variant="outline"
                                    iconSize="md"
                                    className="h-[50px] w-[50px] rounded-full border-b-4 border-black/10 border-2 border-dashed border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10"
                                    disabled={!selectedSet}
                                    onClick={() => selectedSet ? void deleteSet(selectedSet.id) : undefined}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedSet ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
                        <Card className="rounded-[40px] border-2 border-dashed border-border bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden xl:sticky xl:top-6">
                            <CardHeader className="border-b-2 border-dashed border-border bg-muted/10">
                                <CardTitle className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-base font-black uppercase tracking-widest">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        {uiText.days}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <IconButton
                                            label={uiText.addDay}
                                            variant="outline"
                                            iconSize="md"
                                            className="h-[50px] w-[50px] rounded-full border-b-4 border-black/10 border-2 border-dashed bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                            onClick={() => void (async () => {
                                                if (!selectedSet) return
                                                const maxDay = Math.max(...dayKeys.map((d) => Number(d)).filter((n) => Number.isFinite(n) && n > 0))
                                                const nextDay = maxDay + 1
                                                if (nextDay > DEFAULT_MAX_DAYS) {
                                                    toast.error(uiText.maxDaysReached(DEFAULT_MAX_DAYS))
                                                    return
                                                }

                                                const baseGroups = getBaseGroups(selectedSet)
                                                const meta = getMeta(selectedSet)

                                                const nextDayData =
                                                    buildStandardDayData(nextDay) ??
                                                    (baseGroups[String(maxDay)]
                                                        ? JSON.parse(JSON.stringify(baseGroups[String(maxDay)]))
                                                        : CALORIE_OPTIONS.map((cal) => ({ id: String(cal), calories: cal, name: `${cal} kcal`, price: null, dishes: [] })))

                                                const updatedGroups = {
                                                    ...baseGroups,
                                                    [String(nextDay)]: nextDayData,
                                                    _meta: {
                                                        ...meta,
                                                        dayOrder: (() => {
                                                            const existing = Array.isArray(meta.dayOrder) ? meta.dayOrder.map(String) : dayKeys.slice();
                                                            if (existing.includes(String(nextDay))) return existing;
                                                            return [...existing, String(nextDay)];
                                                        })(),
                                                    },
                                                }

                                                const updatedSet = { ...selectedSet, calorieGroups: updatedGroups }
                                                setSelectedSet(updatedSet)
                                                setSets((prev) => prev.map((s) => (s.id === updatedSet.id ? updatedSet : s)))
                                                setActiveDay(String(nextDay))
                                                await saveSet(updatedSet)
                                            })()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </IconButton>

                                        <IconButton
                                            label={uiText.delete}
                                            variant="outline"
                                            iconSize="md"
                                            className="h-[50px] w-[50px] rounded-full border-b-4 border-black/10 border-2 border-dashed border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10"
                                            disabled={dayKeys.length <= 1}
                                            onClick={() => void deleteDay(activeDay)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </IconButton>
                                    </div>
                                </CardTitle>
                                <CardDescription className="font-bold uppercase tracking-widest opacity-60 truncate">
                                    {selectedSet.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-6 sm:grid-cols-8 xl:grid-cols-2 gap-2">
                                    {dayKeys.map((day) => (
                                        <Button
                                            key={day}
                                            type="button"
                                            onClick={() => setActiveDay(day.toString())}
                                            size="refIcon"
                                            variant={activeDay === String(day) ? "default" : "ghost"}
                                            className={cn(
                                                '!border-2 border-dashed border-border/60 bg-white/40 dark:bg-muted/40 hover:border-primary/40 text-sm font-black',
                                                activeDay === String(day) ? 'border-primary text-white shadow-lg scale-[1.02]' : 'text-foreground'
                                            )}
                                        >
                                            {day}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="min-h-[600px] flex flex-col rounded-[40px] border-2 border-dashed border-border bg-card shadow-lg overflow-hidden">
                                <CardHeader className="border-b-2 border-dashed border-border bg-muted/10 flex flex-row items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl border-2 border-primary/20 shadow-inner">
                                            {activeDay}
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black">{uiText.dayMenuTitle(activeDay)}</CardTitle>
                                            <CardDescription className="font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[200px] sm:max-w-none">{selectedSet.name}</CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {activeDayGroup ? (
                                            <div className="hidden sm:flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs font-black px-3 py-1 rounded-full border-2 border-dashed tabular-nums">
                                                    {activeDayGroup.calories} kcal
                                                </Badge>
                                                {typeof activeDayGroup.price === 'number' && Number.isFinite(activeDayGroup.price) ? (
                                                    <Badge className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 tabular-nums">
                                                        {formatUzs(activeDayGroup.price)} UZS
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        <IconButton
                                            label={selectedSet.isActive ? 'Active' : 'Activate'}
                                            onClick={() => toggleSetStatus(selectedSet)}
                                            variant={selectedSet.isActive ? "default" : "outline"}
                                            iconSize="md"
                                            className={selectedSet.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
                                            <Flame className="h-4 w-4" />
                                        </IconButton>
                                    </div>
                                </CardHeader>

                                {/* Day Content */}
                                <CardContent className="flex-1 p-0">
                                    {!hasDataForDay ? (
                                            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                                <UtensilsCrossed className="w-16 h-16 text-slate-200 mb-4" />
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">{uiText.noDayDataTitle}</h3>
                                            <p className="max-w-md mb-6">{uiText.noDayDataDesc(activeDay)}</p>
                                            <IconButton label={uiText.copyStandard(activeDay)} onClick={copyStandardMenuToDay} iconSize="md">
                                                <Copy className="h-4 w-4" />
                                            </IconButton>
                                        </div>
                                    ) : (
                                        <Tabs value={activeGroupTab} onValueChange={setActiveGroupTab} className="h-full flex flex-col">
                                            <div className="px-6 py-2 border-b flex items-center gap-2 bg-slate-900 text-white">
                                                <TabsList className="flex flex-wrap w-full justify-start gap-1 bg-transparent">
                                                    {currentDayData.map((g, idx) => (
                                                        <TabsTrigger
                                                            key={g.id}
                                                            value={g.id as string}
                                                            className="px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900"
                                                        >
                                                            <span className="max-w-[160px] truncate">
                                                                {(g.name || '').trim() || `${uiText.group} ${idx + 1}`}
                                                            </span>
                                                            {typeof g.price === 'number' && Number.isFinite(g.price) ? (
                                                                <span className="ml-1 text-[10px] tabular-nums opacity-80">
                                                                    {formatUzsCompact(g.price)}
                                                                </span>
                                                            ) : null}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>

                                                <IconButton
                                                    label={uiText.newGroup}
                                                    variant="outline"
                                                    iconSize="md"
                                                    className={`${rowIconBtnClass} bg-white text-slate-900 hover:bg-slate-100`}
                                                    onClick={() => {
                                                        setEditingGroup(null)
                                                        setIsGroupModalOpen(true)
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </IconButton>

                                                <IconButton
                                                    label={uiText.delete}
                                                    variant="outline"
                                                    iconSize="md"
                                                    className={`${rowIconBtnClass} border-red-300/30 text-red-100 hover:bg-red-600/30`}
                                                    disabled={!activeGroupTab}
                                                    onClick={() => void deleteGroupById(activeGroupTab)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </IconButton>
                                            </div>

                                            {currentDayData.map((group) => {
                                                    const groupIdx = currentDayData.findIndex((g) => g.id === group.id)
                                                    const totalKcal = getGroupCaloriesTotal(group)

                                                    const dishesSorted = (group.dishes || [])
                                                        .slice()
                                                        .sort((a, b) => {
                                                            const aN = typeof (a as any).mealIndex === 'number' ? (a as any).mealIndex : (getMealIndex(String(a.mealType)) ?? 999)
                                                            const bN = typeof (b as any).mealIndex === 'number' ? (b as any).mealIndex : (getMealIndex(String(b.mealType)) ?? 999)
                                                            return aN - bN
                                                        })

                                                    return (
                                                        <TabsContent key={group.id} value={group.id as string} className="flex-1 p-6 m-0 bg-muted/20">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <Flame className="w-5 h-5 text-orange-500" />
                                                                        <span className="font-semibold text-lg truncate">
                                                                            {group.name || `${group.calories} kcal`}
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px] tabular-nums">
                                                                            {group.calories} kcal
                                                                        </Badge>
                                                                        {typeof group.price === 'number' && Number.isFinite(group.price) ? (
                                                                            <Badge variant="secondary" className="text-[10px] tabular-nums">
                                                                                {formatUzs(group.price)} UZS
                                                                            </Badge>
                                                                        ) : null}
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            {Math.round(totalKcal)} kcal
                                                                        </Badge>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <IconButton
                                                                        label={uiText.group}
                                                                        variant="outline"
                                                                        iconSize="md"
                                                                        onClick={() => {
                                                                            setEditingGroup({ groupIndex: groupIdx, group })
                                                                            setIsGroupModalOpen(true)
                                                                        }}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </IconButton>

                                                                    <IconButton
                                                                        label={uiText.addMeal}
                                                                        iconSize="md"
                                                                        onClick={() => {
                                                                            setAddDishTarget({ calorieIndex: groupIdx })
                                                                            resetAddMealDraft()
                                                                            setIsAddDishModalOpen(true)
                                                                        }}
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </IconButton>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                                {dishesSorted.map((dish, idx) => {
                                                                    const mealIndex =
                                                                        typeof (dish as any).mealIndex === 'number'
                                                                            ? (dish as any).mealIndex
                                                                            : (getMealIndex(String(dish.mealType)) ?? 1)
                                                                    const dishKcal = getDishCalories(dish)

                                                                    return (
                                                                        <div key={`${dish.dishId}-${idx}`} className="bg-card p-3 rounded-xl border border-border hover:shadow-md transition-all flex gap-3 group relative">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex justify-between items-start gap-2">
                                                                                    <div className="min-w-0">
                                                                                        <Badge variant="outline" className="text-[10px] mb-1">
                                                                                            {uiText.mealLabel(mealIndex)}
                                                                                        </Badge>
                                                                                        <h4 className="font-medium text-sm line-clamp-2">{dish.dishName}</h4>
                                                                                        <div className="mt-1 text-[10px] text-muted-foreground">
                                                                                            {Math.round(dishKcal)} kcal
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex gap-1 shrink-0">
                                                                                        <IconButton
                                                                                            label={uiText.editMeal}
                                                                                            variant="ghost"
                                                                                            iconSize="sm"
                                                                                            className="h-7 w-7"
                                                                                            onClick={() => {
                                                                                                setEditingDish({
                                                                                                    setId: selectedSet.id,
                                                                                                    calorieIndex: groupIdx,
                                                                                                    dishIndex: idx,
                                                                                                    dish: { ...dish }
                                                                                                });
                                                                                                setIsEditDishModalOpen(true);
                                                                                            }}
                                                                                        >
                                                                                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                                                                                        </IconButton>
                                                                                        <IconButton
                                                                                            label="Delete"
                                                                                            variant="ghost"
                                                                                            iconSize="sm"
                                                                                            className="h-7 w-7"
                                                                                            onClick={() => deleteDishFromGroup(groupIdx, idx)}
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                                                        </IconButton>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mt-2 text-xs text-slate-500">
                                                                                    {dish.customIngredients ? (
                                                                                        <span className="text-amber-600 font-medium flex items-center gap-1">
                                                                                            <Scale className="w-3 h-3" /> {uiText.customWeight}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-slate-400 flex items-center gap-1">
                                                                                            <Scale className="w-3 h-3" /> {uiText.standard}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}

                                                                {(!group?.dishes || group.dishes.length === 0) && (
                                                                    <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed rounded-lg">
                                                                        {uiText.noDishes}
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
                        <p>{uiText.selectSetHint}</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{uiText.newSet}</DialogTitle>
                        <DialogDescription>{uiText.subtitle}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{uiText.setName}</Label>
                            <Input
                                value={newSetForm.name}
                                onChange={(e) => setNewSetForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={uiText.setName}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={createSet}>{uiText.create}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Group Modal */}
            <Dialog
                open={isGroupModalOpen}
                onOpenChange={(open) => {
                    setIsGroupModalOpen(open);
                    if (!open) setEditingGroup(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? uiText.group : uiText.newGroup}</DialogTitle>
                        <DialogDescription>{uiText.groups}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 py-4">
                        <div className="grid gap-2">
                            <Label>{uiText.groupName}</Label>
                            <Input
                                value={groupForm.name}
                                onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder={uiText.groupName}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>{uiText.groupPrice}</Label>
                            <Input
                                inputMode="decimal"
                                value={groupForm.price}
                                onChange={(e) => setGroupForm((prev) => ({ ...prev, price: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>
                            {uiText.cancel}
                        </Button>
                        <Button onClick={() => void upsertGroup()}>
                            {uiText.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Dish Modal */}
            <Dialog
                open={isAddDishModalOpen}
                onOpenChange={(open) => {
                    setIsAddDishModalOpen(open);
                    if (!open) {
                        setAddDishTarget(null);
                        resetAddMealDraft();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>{uiText.addMeal}</DialogTitle>
                        <DialogDescription>{uiText.dish} / {uiText.meal}</DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-4 flex-1 overflow-auto space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label className="min-w-0">{uiText.mealName}</Label>
                                <div className="flex items-center gap-2">
                                    {selectedDishToAdd ? (
                                        <Badge variant="secondary" className="text-[10px]">DB</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px]">NEW</Badge>
                                    )}
                                </div>
                            </div>
                            <Input
                                value={mealNameToAdd}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setMealNameToAdd(v);
                                    // If user starts typing a different name, treat it as a new dish draft.
                                    if (selectedDishToAdd) {
                                        const selected = availableDishes.find(d => String((d as any).id) === selectedDishToAdd);
                                        if (selected && normalizeName(String((selected as any).name || '')) !== normalizeName(v)) {
                                            setSelectedDishToAdd('');
                                        }
                                    }
                                }}
                                placeholder={uiText.mealNamePlaceholder}
                            />

                            {mealNameToAdd.trim().length > 0 ? (
                                <div className="rounded-md border border-border bg-card">
                                    <ScrollArea className="max-h-44">
                                        <div className="p-2 space-y-1">
                                            {availableDishes
                                                .filter((d) => normalizeName(String((d as any).name || '')).includes(normalizeName(mealNameToAdd)))
                                                .slice(0, 12)
                                                .map((d) => {
                                                    const isSelected = String((d as any).id) === selectedDishToAdd;
                                                    return (
                                                        <Button
                                                            key={String((d as any).id)}
                                                            type="button"
                                                            onClick={() => selectDishForAdd(d)}
                                                            variant="ghost"
                                                            size="refSm"
                                                            className={cn(
                                                                'w-full justify-between gap-2 text-left hover:bg-muted/60',
                                                                isSelected && 'bg-muted'
                                                            )}
                                                        >
                                                            <span className="truncate">{String((d as any).name || '')}</span>
                                                            {isSelected ? (
                                                                <Badge variant="secondary" className="text-[10px] shrink-0">Selected</Badge>
                                                            ) : null}
                                                        </Button>
                                                    );
                                                })}
                                            {availableDishes.filter((d) => normalizeName(String((d as any).name || '')).includes(normalizeName(mealNameToAdd))).length === 0 ? (
                                                <div className="px-2 py-2 text-sm text-muted-foreground">
                                                    {uiText.newDish}
                                                </div>
                                            ) : null}
                                        </div>
                                    </ScrollArea>
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold">{uiText.ingredients}</div>
                                    <div className="text-xs text-muted-foreground truncate">{uiText.ingredientsDesc}</div>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">{uiText.tableName}</TableHead>
                                        <TableHead className="w-[110px]">{uiText.tableAmount}</TableHead>
                                        <TableHead className="w-[90px]">{uiText.tableUnit}</TableHead>
                                        <TableHead className="w-[48px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftMealIngredients.map((ing, idx) => (
                                        <TableRow key={`${ing.name}-${idx}`}>
                                            <TableCell className="pl-4 font-medium min-w-0">
                                                <div className="truncate">{ing.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8 w-24"
                                                    value={ing.amount}
                                                    onChange={(e) => {
                                                        const newVal = parseFloat(e.target.value);
                                                        updateDraftIngredientAmount(idx, Number.isFinite(newVal) ? newVal : 0);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{ing.unit}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeDraftIngredient(idx)}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {draftMealIngredients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                                {uiText.noIngredients}
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>

                            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold">{uiText.addIngredient}</Label>
                                    <Select onValueChange={(val) => addDraftIngredient(val)}>
                                        <SelectTrigger className="bg-card">
                                            <SelectValue placeholder={uiText.selectIngredient} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {getAllUniqueIngredients().map((ing) => (
                                                <SelectItem key={ing.name} value={ing.name}>
                                                    <div className="flex justify-between w-full min-w-[200px]">
                                                        <span className="truncate">{ing.name}</span>
                                                        <span className="text-muted-foreground text-xs">{ing.unit}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddDishModalOpen(false)}>{uiText.cancel}</Button>
                        <Button onClick={addDishToGroup} disabled={!mealNameToAdd.trim()}>{uiText.addMeal}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Ingredients Modal */}
            <Dialog open={isEditDishModalOpen} onOpenChange={setIsEditDishModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>{uiText.ingredients}: {editingDish?.dish.dishName}</DialogTitle>
                        <DialogDescription>
                            {uiText.ingredientsDesc}
                        </DialogDescription>
                    </DialogHeader>
                    {editingDish && (
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="bg-muted/30 sticky top-0">
                                    <TableRow>
                                        <TableHead className="pl-6">{uiText.tableName}</TableHead>
                                        <TableHead>{uiText.tableAmount}</TableHead>
                                        <TableHead>{uiText.tableUnit}</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(editingDish.dish.customIngredients || getOriginalIngredients(editingDish.dish.dishId)).map((ing, idx) => (
                                        <TableRow key={`${ing.name}-${idx}`}>
                                            <TableCell className="pl-6 font-medium">{ing.name}</TableCell>
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
                                            <TableCell className="text-muted-foreground text-sm">{ing.unit}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={() => removeIngredient(idx)}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(editingDish.dish.customIngredients || getOriginalIngredients(editingDish.dish.dishId)).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                                {uiText.noIngredients}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">{uiText.addIngredient}</Label>
                            <Select onValueChange={(val) => {
                                addIngredient(val);
                                // Hack to reset select not needed if we want to add multiple? No, value stays.
                                // It's fine for now.
                            }}>
                                <SelectTrigger className="bg-card">
                                    <SelectValue placeholder={uiText.selectIngredient} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {getAllUniqueIngredients().map((ing) => (
                                        <SelectItem key={ing.name} value={ing.name}>
                                            <div className="flex justify-between w-full min-w-[200px]">
                                                <span>{ing.name}</span>
                                                <span className="text-muted-foreground text-xs">{ing.unit}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsEditDishModalOpen(false)}>{uiText.cancel}</Button>
                            <Button onClick={updateEditingDish}>{uiText.saveChanges}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
