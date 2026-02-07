'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogOut } from 'lucide-react'
import { CourierProfile } from '@/components/courier/CourierProfile'

type Courier = {
  id: string
  name: string
  email: string
  role: string
}

export default function CourierPage() {
  const [courier, setCourier] = useState<Courier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/courier/profile')
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || 'Не удалось загрузить профиль')
          return
        }
        setCourier(data)
      } catch {
        setError('Ошибка соединения с сервером')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!courier) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Курьер</h1>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>

        <CourierProfile courier={courier} />
      </div>
    </div>
  )
}

