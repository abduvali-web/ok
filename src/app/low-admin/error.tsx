'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-500 p-6">
      <div className="max-w-xl w-full rounded-[40px] border-2 border-dashed border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 p-10 md:p-16 text-center relative overflow-hidden">
        {/* Background watermark */}
        <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
          <AlertTriangle className="w-40 h-40 text-rose-600" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center border-b-4 border-black/10 shadow-xl">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight uppercase mb-2">
              Something went wrong
            </h2>
            <p className="text-sm font-medium text-muted-foreground/60">
              Please try again. If the problem persists, contact support.
              {error.digest ? ` (ref: ${error.digest})` : null}
            </p>
          </div>

          <button
            onClick={reset}
            className="w-[50px] h-[50px] bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 hover:scale-110"
          >
            <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-foreground" />
            </div>
          </button>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            Click to retry
          </p>
        </div>
      </div>
    </div>
  )
}
