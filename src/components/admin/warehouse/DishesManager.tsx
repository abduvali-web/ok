'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { MEAL_TYPES } from '@/lib/menuData';

interface IngredientRef {
    name: string;
    amount: number;
    unit: string;
}

interface Dish {
    id: string;
    name: string;
    description?: string;
    mealType: string;
    ingredients: IngredientRef[];
    imageUrl?: string;
}

interface WarehouseItem {
    id: string;
    name: string;
    unit: string;
}

export function DishesManager() {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentDish, setCurrentDish] = useState<Partial<Dish>>({ ingredients: [] });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dishesRes, itemsRes] = await Promise.all([
                fetch('/api/admin/warehouse/dishes'),
                fetch('/api/admin/warehouse/ingredients')
            ]);

            if (dishesRes.ok) {
                setDishes(await dishesRes.json());
            }
            if (itemsRes.ok) {
                setWarehouseItems(await itemsRes.json());
            }
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentDish.name || !currentDish.mealType) {
            toast.error('Name and Meal Type are required');
            return;
        }

        setIsSaving(true);
        try {
            const method = currentDish.id ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/warehouse/dishes', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentDish),
            });

            if (res.ok) {
                toast.success(currentDish.id ? 'Dish updated' : 'Dish created');
                fetchData();
                setIsDialogOpen(false);
                setCurrentDish({ ingredients: [] });
            } else {
                toast.error('Failed to save dish');
            }
        } catch (error) {
            console.error('Error saving dish', error);
            toast.error('Error saving dish');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this dish?')) return;

        try {
            const res = await fetch(`/api/admin/warehouse/dishes?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Dish deleted');
                fetchData();
            } else {
                toast.error('Failed to delete dish');
            }
        } catch (error) {
            console.error('Error deleting dish', error);
            toast.error('Error deleting dish');
        }
    };

    const addIngredientRow = () => {
        setCurrentDish(prev => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), { name: '', amount: 0, unit: 'gr' }]
        }));
    };

    const removeIngredientRow = (index: number) => {
        setCurrentDish(prev => ({
            ...prev,
            ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
        }));
    };

    const updateIngredientRow = (index: number, field: keyof IngredientRef, value: any) => {
        setCurrentDish(prev => {
            const newIngredients = [...(prev.ingredients || [])];
            newIngredients[index] = { ...newIngredients[index], [field]: value };

            // If selecting a warehouse item, auto-fill unit
            if (field === 'name') {
                const item = warehouseItems.find(i => i.name === value);
                if (item) {
                    newIngredients[index].unit = item.unit;
                }
            }

            return { ...prev, ingredients: newIngredients };
        });
    };

    const filteredDishes = dishes.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search dishes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => { setCurrentDish({ ingredients: [], unit: 'gr' } as any); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Dish
                </Button>
            </div>

            <div className="bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Meal Type</TableHead>
                            <TableHead>Ingredients</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredDishes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    No dishes found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDishes.map((dish) => (
                                <TableRow key={dish.id}>
                                    <TableCell>
                                        {dish.imageUrl && (
                                            <img src={dish.imageUrl} alt={dish.name} className="w-10 h-10 object-cover rounded-md" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{dish.name}</TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100">
                                            {MEAL_TYPES[dish.mealType as keyof typeof MEAL_TYPES] || dish.mealType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                                        {dish.ingredients.map(i => i.name).join(', ')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setCurrentDish(dish); setIsDialogOpen(true); }}>
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dish.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentDish.id ? 'Edit Dish' : 'Add Dish'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={currentDish.name || ''}
                                    onChange={(e) => setCurrentDish({ ...currentDish, name: e.target.value })}
                                    placeholder="Dish Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meal Type</Label>
                                <Select
                                    value={currentDish.mealType}
                                    onValueChange={(val) => setCurrentDish({ ...currentDish, mealType: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(MEAL_TYPES).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Image URL (Optional)</Label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <Input
                                        value={currentDish.imageUrl || ''}
                                        onChange={(e) => setCurrentDish({ ...currentDish, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Paste a direct link to an image (JPG, PNG, WebP)
                                    </p>
                                </div>
                                {currentDish.imageUrl && (
                                    <div className="w-20 h-20 rounded-lg border bg-slate-50 overflow-hidden flex-shrink-0">
                                        <img
                                            src={currentDish.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Ingredients</Label>
                                <Button size="sm" variant="outline" onClick={addIngredientRow} type="button">
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-2 border rounded-lg p-2 bg-slate-50">
                                {currentDish.ingredients?.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Ingredient</Label>
                                            {/* Ideally a combobox, but Select for now */}
                                            <Select
                                                value={ing.name}
                                                onValueChange={(val) => updateIngredientRow(idx, 'name', val)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouseItems.map(item => (
                                                        <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <Label className="text-xs">Amount</Label>
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={ing.amount}
                                                onChange={(e) => updateIngredientRow(idx, 'amount', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Label className="text-xs">Unit</Label>
                                            <Input
                                                className="h-8"
                                                value={ing.unit}
                                                onChange={(e) => updateIngredientRow(idx, 'unit', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 mb-0.5"
                                            onClick={() => removeIngredientRow(idx)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!currentDish.ingredients || currentDish.ingredients.length === 0) && (
                                    <div className="text-center text-xs text-slate-400 py-2">No ingredients added</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
