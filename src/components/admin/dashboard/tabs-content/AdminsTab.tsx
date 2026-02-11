'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Edit,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'

import type { Admin } from '@/components/admin/dashboard/types'
import { mapLegacyAllowedTabId, type CanonicalTabId } from '@/components/admin/dashboard/tabs'
import { AllowedTabsPicker } from '@/components/admin/dashboard/AllowedTabsPicker'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'

type AdminRoleOption = 'LOW_ADMIN' | 'COURIER' | 'WORKER'

type AdminFormData = {
  name: string
  email: string
  password: string
  role: AdminRoleOption
  salary: number
  allowedTabs: string[]
}

type EditAdminFormData = AdminFormData & {
  isActive: boolean
}

function normalizeAllowedTabsForForm(tabs: string[] | null | undefined) {
  const inputTabs = Array.isArray(tabs) ? tabs : []
  const mapped = inputTabs.map(mapLegacyAllowedTabId)
  return Array.from(new Set(mapped))
}

export function AdminsTab({
  lowAdmins,
  isLowAdminView,
  onRefresh,
  tabsCopy,
}: {
  lowAdmins: Admin[]
  isLowAdminView: boolean
  onRefresh: () => void
  tabsCopy: Record<CanonicalTabId, string>
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [createFormData, setCreateFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    role: 'LOW_ADMIN',
    allowedTabs: [],
    salary: 0,
  })

  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [editAdminFormData, setEditAdminFormData] = useState<EditAdminFormData>({
    name: '',
    email: '',
    password: '',
    role: 'LOW_ADMIN',
    allowedTabs: [],
    salary: 0,
    isActive: true,
  })

  const roleBadge = useMemo(() => {
    return (role: string) =>
      role === 'COURIER' ? 'Курьер' : role === 'WORKER' ? 'Работник' : 'Низкий администратор'
  }, [])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError('')

    try {
      const response = await fetch('/api/admin/low-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        setIsCreateModalOpen(false)
        setCreateFormData({
          name: '',
          email: '',
          password: '',
          role: 'LOW_ADMIN',
          allowedTabs: [],
          salary: 0,
        })
        onRefresh()
        toast.success('Администратор успешно создан')
      } else {
        setCreateError((data && data.error) || 'Ошибка создания администратора')
      }
    } catch {
      setCreateError('Ошибка соединения с сервером')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin)
    setEditAdminFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role as AdminRoleOption,
      isActive: admin.isActive,
      allowedTabs: normalizeAllowedTabsForForm(admin.allowedTabs),
      salary: admin.salary || 0,
    })
    setIsEditAdminModalOpen(true)
  }

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    try {
      const response = await fetch(`/api/admin/low-admins/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editAdminFormData.name,
          email: editAdminFormData.email,
          role: editAdminFormData.role,
          isActive: editAdminFormData.isActive,
          allowedTabs: editAdminFormData.allowedTabs,
          salary: editAdminFormData.salary,
          ...(editAdminFormData.password ? { password: editAdminFormData.password } : {}),
        }),
      })

      if (response.ok) {
        setIsEditAdminModalOpen(false)
        setEditingAdmin(null)
        onRefresh()
        toast.success('Администратор успешно обновлен')
      } else {
        const data = await response.json().catch(() => null)
        toast.error((data && data.error) || 'Ошибка обновления администратора', {
          description: (data && data.details) || undefined,
        })
      }
    } catch (error) {
      console.error('Error updating admin:', error)
      toast.error('Ошибка обновления администратора')
    }
  }

  return (
    <>
      <TabsContent value="admins" className="space-y-6">
        <Card className="glass-card border-none">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Управление Низкими Администраторами и Курьерами</CardTitle>
                <CardDescription>Добавляйте, удаляйте и управляйте низкими администраторами и курьерами</CardDescription>
              </div>
              {!isLowAdminView && (
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Добавить Администратора или Курьера</DialogTitle>
                      <DialogDescription>Создайте нового низкого администратора или курьера</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAdmin}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-2">
                          <Label htmlFor="name" className="text-right">
                            Имя
                          </Label>
                          <Input
                            id="name"
                            value={createFormData.name}
                            onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-2">
                          <Label htmlFor="email" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={createFormData.email}
                            onChange={(e) => setCreateFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">
                            Пароль
                          </Label>
                          <div className="col-span-3 relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={createFormData.password}
                              onChange={(e) =>
                                setCreateFormData((prev) => ({ ...prev, password: e.target.value }))
                              }
                              required={createFormData.role !== 'WORKER'}
                              minLength={6}
                              placeholder={createFormData.role === 'WORKER' ? 'Необязательно' : ''}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-2">
                          <Label htmlFor="role" className="text-right">
                            Роль
                          </Label>
                          <select
                            id="role"
                            value={createFormData.role}
                            onChange={(e) =>
                              setCreateFormData((prev) => ({ ...prev, role: e.target.value as AdminRoleOption }))
                            }
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="LOW_ADMIN">Низкий администратор</option>
                            <option value="COURIER">Курьер</option>
                            <option value="WORKER">Работник</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-2">
                          <Label htmlFor="salary" className="text-right">
                            Зарплата
                          </Label>
                          <Input
                            id="salary"
                            type="number"
                            value={createFormData.salary}
                            onChange={(e) =>
                              setCreateFormData((prev) => ({ ...prev, salary: parseInt(e.target.value) || 0 }))
                            }
                            className="col-span-3"
                            placeholder="0"
                          />
                        </div>
                        {createFormData.role === 'LOW_ADMIN' && (
                          <div className="col-span-4 space-y-3 border-t pt-4">
                            <Label className="text-sm font-medium">Разрешенные вкладки</Label>
                            <p className="text-xs text-muted-foreground">
                              Выберите, какие вкладки будут доступны для этого администратора
                            </p>
                            <AllowedTabsPicker
                              idPrefix="create-tab"
                              value={createFormData.allowedTabs}
                              onChange={(next) =>
                                setCreateFormData((prev) => ({ ...prev, allowedTabs: next }))
                              }
                              copy={tabsCopy}
                            />
                          </div>
                        )}
                        {createError && (
                          <div className="col-span-4">
                            <Alert variant="destructive">
                              <AlertDescription>{createError}</AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Отмена
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? 'Создание...' : 'Создать'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Desktop View */}
            <div className="hidden md:block space-y-4">
              {lowAdmins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-slate-500">{admin.email}</p>
                      <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                        {roleBadge(admin.role)}
                      </Badge>
                      <Badge
                        variant={admin.isActive ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {admin.isActive ? 'Активен' : 'Приостановлен'}
                      </Badge>
                    </div>
                  </div>
                  {!isLowAdminView && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/${admin.id}/password`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            })
                            if (response.ok) {
                              const data = await response.json().catch(() => ({}))
                              toast.info(
                                data.password || 'Пароль скрыт. Используйте функцию сброса.'
                              )
                            } else {
                              toast.error('Ошибка получения пароля')
                            }
                          } catch {
                            toast.error('Ошибка соединения с сервером')
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Пароль
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/${admin.id}/toggle-status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: !admin.isActive }),
                            })
                            if (response.ok) {
                              onRefresh()
                              toast.success(
                                `Статус ${admin.isActive ? 'приостановлен' : 'активирован'}`
                              )
                            } else {
                              toast.error('Ошибка изменения статуса')
                            }
                          } catch {
                            toast.error('Ошибка соединения с сервером')
                          }
                        }}
                      >
                        {admin.isActive ? (
                          <Pause className="w-4 h-4 mr-1" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        {admin.isActive ? 'Приостановить' : 'Активировать'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Вы уверены, что хотите удалить администратора ${admin.name}?`)) return
                          try {
                            const response = await fetch(`/api/admin/low-admins/${admin.id}`, {
                              method: 'DELETE',
                              headers: {},
                            })
                            if (response.ok) {
                              onRefresh()
                              toast.success('Администратор удален')
                            } else {
                              const data = await response.json().catch(() => null)
                              toast.error((data && data.error) || 'Ошибка удаления администратора')
                            }
                          } catch {
                            toast.error('Ошибка соединения с сервером')
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditAdmin(admin)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Изменить
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {lowAdmins.map((admin) => (
                <Card key={admin.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">{admin.name}</CardTitle>
                        <CardDescription className="text-xs">{admin.email}</CardDescription>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={admin.isActive ? 'default' : 'secondary'} className="text-xs">
                            {roleBadge(admin.role)}
                          </Badge>
                          <Badge variant={admin.isActive ? 'default' : 'secondary'} className="text-xs">
                            {admin.isActive ? 'Активен' : 'Пауза'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!isLowAdminView && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/admin/${admin.id}/password`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                              })
                              if (response.ok) {
                                const data = await response.json().catch(() => ({}))
                                toast.info(
                                  data.password || 'Пароль скрыт. Используйте функцию сброса.'
                                )
                              } else {
                                toast.error('Ошибка получения пароля')
                              }
                            } catch {
                              toast.error('Ошибка соединения с сервером')
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Пароль
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleEditAdmin(admin)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Изменить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/admin/${admin.id}/toggle-status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isActive: !admin.isActive }),
                              })
                              if (response.ok) {
                                onRefresh()
                                toast.success(
                                  `Статус ${admin.isActive ? 'приостановлен' : 'активирован'}`
                                )
                              } else {
                                toast.error('Ошибка изменения статуса')
                              }
                            } catch {
                              toast.error('Ошибка соединения с сервером')
                            }
                          }}
                        >
                          {admin.isActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                          {admin.isActive ? 'Пауза' : 'Старт'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return
                            try {
                              const response = await fetch(`/api/admin/low-admins/${admin.id}`, {
                                method: 'DELETE',
                                headers: {},
                              })
                              if (response.ok) {
                                onRefresh()
                                toast.success('Пользователь удален')
                              } else {
                                toast.error('Ошибка удаления')
                              }
                            } catch {
                              toast.error('Ошибка соединения с сервером')
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={isEditAdminModalOpen} onOpenChange={setIsEditAdminModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать Администратора</DialogTitle>
            <DialogDescription>Измените данные администратора или курьера</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAdmin}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Имя
                </Label>
                <Input
                  id="edit-name"
                  value={editAdminFormData.name}
                  onChange={(e) => setEditAdminFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editAdminFormData.email}
                  onChange={(e) => setEditAdminFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Пароль
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  value={editAdminFormData.password}
                  onChange={(e) => setEditAdminFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Роль
                </Label>
                <select
                  id="edit-role"
                  value={editAdminFormData.role}
                  onChange={(e) =>
                    setEditAdminFormData((prev) => ({ ...prev, role: e.target.value as AdminRoleOption }))
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LOW_ADMIN">Низкий администратор</option>
                  <option value="COURIER">Курьер</option>
                  <option value="WORKER">Работник</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-salary" className="text-right">
                  Зарплата
                </Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editAdminFormData.salary || ''}
                  onChange={(e) =>
                    setEditAdminFormData((prev) => ({ ...prev, salary: parseInt(e.target.value) || 0 }))
                  }
                  className="col-span-3"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-active" className="text-right">
                  Статус
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="edit-active"
                    checked={editAdminFormData.isActive}
                    onCheckedChange={(checked) =>
                      setEditAdminFormData((prev) => ({ ...prev, isActive: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="edit-active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Активен
                  </label>
                </div>
              </div>

              {editAdminFormData.role === 'LOW_ADMIN' && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Доступ к вкладкам</Label>
                  <div className="col-span-3 space-y-2 border rounded-md p-3">
                    <AllowedTabsPicker
                      idPrefix="edit-tab"
                      value={editAdminFormData.allowedTabs}
                      onChange={(next) => setEditAdminFormData((prev) => ({ ...prev, allowedTabs: next }))}
                      copy={tabsCopy}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditAdminModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

