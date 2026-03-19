'use client'

import { motion } from 'framer-motion'
import {
  Utensils,
  CookingPot,
  Cherry,
  PieChart,
  TrendingUp,
  CreditCard,
  Users,
  Beef,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { TabsContent } from '@/components/ui/tabs'

interface StatisticsTabProps {
  stats: any
}

export function StatisticsTab({ stats }: StatisticsTabProps) {
  const { t } = useLanguage()

  const cardContainer = "grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
  
  const StatItem = ({ label, value, sub, color, dot, icon: Icon }: any) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-6 md:p-8 bg-gourmet-cream/40 dark:bg-dark-green/10 hover:bg-gourmet-green/10 dark:hover:bg-dark-green/20 transition-all duration-300 overflow-hidden"
    >
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {Icon && <Icon className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />}
        </div>
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("inline-block h-3 w-3 rounded-full shadow-lg", dot)} />
        <span className="text-xs md:text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">{label}</span>
      </div>
      <div className={cn("text-3xl md:text-5xl font-black tracking-tighter", color)}>{value}</div>
      <p className="text-sm md:text-lg font-bold text-gourmet-ink/40 dark:text-dark-text/40 mt-2">{sub}</p>
      
      {/* Mini accent bar */}
      <div className={cn("absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500", dot)} />
    </motion.div>
  )

  return (
    <TabsContent value="statistics" className="min-h-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="content-card flex-1 min-h-0 flex flex-col gap-8 md:gap-14 relative overflow-hidden px-4 md:px-14 py-8 md:py-16 transition-colors duration-300"
      >
        {/* Background Watermark */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
        >
          <PieChart className="w-64 h-64 md:w-80 md:h-80 text-gourmet-ink dark:text-dark-text" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-5xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
          >
            {t.admin.statistics}
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-2xl text-gourmet-ink/60 dark:text-dark-text/60 font-medium"
          >
            Sizning biznesingiz raqamlarda
          </motion.p>
        </div>

        <div className="space-y-12 md:space-y-20 relative z-10 flex-1 overflow-auto no-scrollbar pb-10">
          {/* Order Status */}
          <section>
            <div className="flex items-center gap-4 mb-8">
                <TrendingUp className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Buyurtmalar holati</h3>
            </div>
            <div className={cardContainer}>
              <StatItem 
                label={t.admin.stats.successful} 
                value={stats?.successfulOrders || 0} 
                sub="Yetkazildi" 
                color="text-emerald-600 dark:text-emerald-400" 
                dot="bg-emerald-500" 
                icon={CookingPot}
              />
              <StatItem 
                label={t.admin.stats.failed} 
                value={stats?.failedOrders || 0} 
                sub="Bekor qilindi" 
                color="text-rose-600 dark:text-rose-400" 
                dot="bg-rose-500" 
                icon={Cherry}
              />
              <StatItem 
                label={t.admin.stats.inDelivery} 
                value={stats?.inDeliveryOrders || 0} 
                sub="Yo'lda" 
                color="text-blue-600 dark:text-blue-400" 
                dot="bg-blue-500" 
                icon={Utensils}
              />
              <StatItem 
                label={t.admin.stats.pending} 
                value={stats?.pendingOrders || 0} 
                sub="Kutilmoqda" 
                color="text-amber-600 dark:text-amber-400" 
                dot="bg-amber-500" 
                icon={TrendingUp}
              />
            </div>
          </section>

          {/* Payment Stats */}
          <section>
            <div className="flex items-center gap-4 mb-8">
                <CreditCard className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">To'lovlar tahlili</h3>
            </div>
            <div className={cardContainer}>
              <StatItem 
                label={t.admin.stats.prepaid} 
                value={stats?.prepaidOrders || 0} 
                sub="Oldindan to'lov" 
                color="text-emerald-600 dark:text-emerald-400" 
                dot="bg-emerald-500" 
                icon={CreditCard}
              />
              <StatItem 
                label={t.admin.stats.unpaid} 
                value={stats?.unpaidOrders || 0} 
                sub="To'lanmagan" 
                color="text-rose-600 dark:text-rose-400" 
                dot="bg-rose-500" 
                icon={CreditCard}
              />
              <StatItem 
                label={t.admin.stats.card} 
                value={stats?.cardOrders || 0} 
                sub="Karta orqali" 
                color="text-blue-600 dark:text-blue-400" 
                dot="bg-blue-500" 
                icon={CreditCard}
              />
              <StatItem 
                label={t.admin.stats.cash} 
                value={stats?.cashOrders || 0} 
                sub="Naqd pul" 
                color="text-teal-600 dark:text-teal-400" 
                dot="bg-teal-500" 
                icon={CreditCard}
              />
            </div>
          </section>

          {/* Customer Stats */}
          <section>
            <div className="flex items-center gap-4 mb-8">
                <Users className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Mijozlar faolligi</h3>
            </div>
            <div className={cardContainer}>
              <StatItem 
                label={t.admin.stats.daily} 
                value={stats?.dailyCustomers || 0} 
                sub="Har kuni" 
                color="text-violet-600 dark:text-violet-400" 
                dot="bg-violet-500" 
                icon={Users}
              />
              <StatItem 
                label={t.admin.stats.evenDay} 
                value={stats?.evenDayCustomers || 0} 
                sub="Juft kunlar" 
                color="text-indigo-600 dark:text-indigo-400" 
                dot="bg-indigo-500" 
                icon={Users}
              />
              <StatItem 
                label={t.admin.stats.oddDay} 
                value={stats?.oddDayCustomers || 0} 
                sub="Toq kunlar" 
                color="text-pink-600 dark:text-pink-400" 
                dot="bg-pink-500" 
                icon={Users}
              />
              <StatItem 
                label={t.admin.stats.special} 
                value={stats?.specialPreferenceCustomers || 0} 
                sub="Maxsus" 
                color="text-orange-600 dark:text-orange-400" 
                dot="bg-orange-500" 
                icon={Users}
              />
            </div>
          </section>

          {/* Calories */}
          <section>
            <div className="flex items-center gap-4 mb-8">
                <Beef className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Ratsionlar tahlili</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
              <StatItem 
                label="1200 kcal" 
                value={stats?.orders1200 || 0} 
                sub={t.admin.stats.lowCal} 
                color="text-rose-600 dark:text-rose-400" 
                dot="bg-rose-500" 
                icon={Beef}
              />
              <StatItem 
                label="1600 kcal" 
                value={stats?.orders1600 || 0} 
                sub={t.admin.stats.standard} 
                color="text-orange-600 dark:text-orange-400" 
                dot="bg-orange-500" 
                icon={Beef}
              />
              <StatItem 
                label="2000 kcal" 
                value={stats?.orders2000 || 0} 
                sub={t.admin.stats.medium} 
                color="text-yellow-600 dark:text-yellow-400" 
                dot="bg-yellow-500" 
                icon={Beef}
              />
              <StatItem 
                label="2500 kcal" 
                value={stats?.orders2500 || 0} 
                sub={t.admin.stats.high} 
                color="text-emerald-600 dark:text-emerald-400" 
                dot="bg-emerald-500" 
                icon={Beef}
              />
              <StatItem 
                label="3000 kcal" 
                value={stats?.orders3000 || 0} 
                sub={t.admin.stats.max} 
                color="text-blue-600 dark:text-blue-400" 
                dot="bg-blue-500" 
                icon={Beef}
              />
            </div>
          </section>
        </div>
      </motion.div>
    </TabsContent>
  )
}
