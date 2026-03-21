import Link from 'next/link'
import { SearchX, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-500 p-6">
      <div className="max-w-xl w-full rounded-[40px] border-2 border-dashed border-primary/30 bg-muted/40 dark:bg-primary/10 p-10 md:p-16 text-center relative overflow-hidden">
        {/* Background watermark */}
        <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
          <SearchX className="w-40 h-40 text-foreground" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-b-4 border-black/10 shadow-xl">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/30 dark:border-white/10 flex items-center justify-center">
              <SearchX className="w-8 h-8 text-foreground" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight uppercase mb-2">
              Page not found
            </h2>
            <p className="text-sm font-medium text-muted-foreground/60">
              The page you're looking for doesn't exist.
            </p>
          </div>

          <Link
            href="/auth/redirect"
            className="flex items-center gap-3 h-[50px] px-8 bg-primary rounded-full shadow-xl border-b-4 border-black/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="font-bold text-sm text-foreground uppercase tracking-widest">
              Go to dashboard
            </span>
            <ArrowRight className="w-5 h-5 text-foreground" />
          </Link>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            Error 404
          </p>
        </div>
      </div>
    </div>
  )
}
