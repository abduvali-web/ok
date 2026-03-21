export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] dark:bg-dark-bg transition-colors duration-500">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo Pulse */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping absolute inset-0" />
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center relative border-b-4 border-black/20 shadow-2xl">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton cards */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-3 w-40 bg-primary/20 rounded-full animate-pulse" />
          <div className="h-2 w-28 bg-primary/10 rounded-full animate-pulse" />
        </div>

        {/* Loading bar */}
        <div className="w-64 h-2 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
            style={{ animation: 'loading 1.5s ease-in-out infinite' }} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
          Loading Dashboard
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
