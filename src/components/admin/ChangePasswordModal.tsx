'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Loader2, AlertCircle, CheckCircle2, Key, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [passwordStrength, setPasswordStrength] = useState(0)

    const checkPasswordStrength = (password: string) => {
        let strength = 0
        if (password.length >= 8) strength++
        if (password.length >= 12) strength++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
        if (/\d/.test(password)) strength++
        if (/[^a-zA-Z0-9]/.test(password)) strength++
        return strength
    }

    const handleNewPasswordChange = (value: string) => {
        setPasswords({ ...passwords, newPassword: value })
        setPasswordStrength(checkPasswordStrength(value))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (passwords.newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/profile/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Security Update', {
                    description: 'Your password has been changed successfully'
                })
                setPasswords({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                onClose()
            } else {
                setError(data.error || 'Failed to change password')
            }
        } catch {
            setError('Network communication failed')
        } finally {
            setIsLoading(false)
        }
    }

    const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-primary']
    const strengthLabels = ['Vulnerable', 'Weak', 'Acceptable', 'Secure', 'Fortified']

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[40px] border-none bg-white/90 backdrop-blur-3xl p-0 overflow-hidden shadow-2xl transition-all duration-500">
                <div className="relative p-10">
                    <div className="absolute top-6 right-6">
                        <Button type="button" variant="ghost" size="refIconSm" onClick={onClose} className="hover:bg-slate-100">
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>

                    <DialogHeader className="mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed border-primary/20">
                            <Key className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight text-slate-800">
                            Security Credentials
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Update your administrative access phrase. Use high entropy patterns.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm"
                        >
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">Current Access Phrase</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 focus:border-primary pl-12 font-bold"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">New Strong Phrase</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 focus:border-primary pl-12 font-bold"
                                    value={passwords.newPassword}
                                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                                    required
                                />
                            </div>

                            <AnimatePresence>
                                {passwords.newPassword && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 py-2 space-y-2"
                                    >
                                        <div className="flex gap-1.5 h-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex-1 rounded-full transition-all duration-500",
                                                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-100'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Entropy Strength</span>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest",
                                                passwordStrength > 0 ? strengthColors[passwordStrength - 1].replace('bg-', 'text-') : 'text-slate-400'
                                            )}>
                                                {strengthLabels[passwordStrength - 1] || 'Inadequate'}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black opacity-40 ml-4 tracking-widest">Confirm New Phrase</Label>
                            <div className="relative">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 focus:border-primary pl-12 font-bold"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-6 sm:justify-start">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-16 rounded-[28px] bg-primary text-white font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Apply Security Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
