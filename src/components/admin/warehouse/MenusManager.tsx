'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DishesManager } from './DishesManager'; // Or verify correct path

// Since DishesManager is a full manager, let's reuse logic or create a selector
// For simplicity, I'll assume we can select from existing dishes to add to menu

interface Dish {
    id: string;
    name: string;
    mealType: string;
    description: string;
}

interface Menu {
    id: string;
    number: number;
    dishes: Dish[];
}

export function MenusManager() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [selectedMenuNum, setSelectedMenuNum] = useState<string>('1');
    const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(false);
    const [allDishes, setAllDishes] = useState<Dish[]>([]);
    const [isAddDishOpen, setIsAddDishOpen] = useState(false);
    const [searchDish, setSearchDish] = useState('');

    useEffect(() => {
        fetchMenus();
        fetchAllDishes();
    }, []);

    useEffect(() => {
        if (selectedMenuNum) {
            loadMenu(parseInt(selectedMenuNum));
        }
    }, [selectedMenuNum]);

    const fetchMenus = async () => {
        // Just getting numbers 1-21 conceptually, but maybe we fetch from DB to see if they exist
    };

    const fetchAllDishes = async () => {
        try {
            const res = await fetch('/api/admin/warehouse/dishes');
            if (res.ok) {
                setAllDishes(await res.json());
            }
        } catch (error) {
            console.error('Error fetching dishes', error);
        }
    };

    const loadMenu = async (num: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/menus?number=${num}`);
            if (res.ok) {
                setCurrentMenu(await res.json());
            } else {
                setCurrentMenu(null); // Or new menu
            }
        } catch (error) {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDish = async (dishId: string) => {
        if (!currentMenu) return;
        if (!confirm('Remove details from this menu?')) return;

        try {
            const res = await fetch(`/api/admin/menus`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuNumber: currentMenu.number,
                    dishId
                })
            });

            if (res.ok) {
                toast.success('Dish removed');
                loadMenu(currentMenu.number);
            } else {
                toast.error('Failed to remove dish');
            }
        } catch (error) {
            toast.error('Error removing dish');
        }
    };

    const handleAddDish = async (dishId: string) => {
        if (!selectedMenuNum) return;

        try {
            const res = await fetch(`/api/admin/menus`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuNumber: parseInt(selectedMenuNum),
                    dishId
                })
            });

            if (res.ok) {
                toast.success('Dish added');
                setIsAddDishOpen(false);
                loadMenu(parseInt(selectedMenuNum));
            } else {
                toast.error('Failed to add dish');
            }
        } catch (error) {
            toast.error('Error adding dish');
        }
    };

    const filteredDishes = allDishes.filter(d =>
        d.name.toLowerCase().includes(searchDish.toLowerCase()) &&
        !currentMenu?.dishes.some(md => md.id === d.id)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
                <div className="space-y-1">
                    <div className="text-sm font-medium">Select Menu</div>
                    <Select value={selectedMenuNum} onValueChange={setSelectedMenuNum}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Menu" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 21 }, (_, i) => i + 1).map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                    Menu #{num}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Menu #{selectedMenuNum} Content</CardTitle>
                    <Button onClick={() => setIsAddDishOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Dish
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Meal Type</TableHead>
                                    <TableHead>Dish Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentMenu?.dishes?.length ? (
                                    currentMenu.dishes
                                        .sort((a, b) => {
                                            const order = ['BREAKFAST', 'SECOND_BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SIXTH_MEAL'];
                                            return order.indexOf(a.mealType) - order.indexOf(b.mealType);
                                        })
                                        .map(dish => (
                                            <TableRow key={dish.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{dish.mealType}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{dish.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveDish(dish.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                            No dishes in this menu
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Dish to Menu #{selectedMenuNum}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search available dishes..."
                                value={searchDish}
                                onChange={(e) => setSearchDish(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="space-y-2">
                            {filteredDishes.slice(0, 10).map(dish => (
                                <div key={dish.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-slate-50">
                                    <div>
                                        <div className="font-medium">{dish.name}</div>
                                        <div className="text-xs text-slate-500">{dish.mealType}</div>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => handleAddDish(dish.id)}>
                                        Add
                                    </Button>
                                </div>
                            ))}
                            {filteredDishes.length === 0 && <div className="text-center text-sm text-slate-400">No matching dishes found</div>}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
