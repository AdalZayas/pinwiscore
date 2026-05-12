'use client'

import { useGameStore } from '@/lib/game-store'
import { cn } from '@/lib/utils'

export function BaseballDiamond() {
  const { runners } = useGameStore()

  const hasRunner = (base: 'first' | 'second' | 'third') =>
    runners.some((r) => r.base === base)

  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Field background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rotate-45 border-2 border-field rounded-sm" />
      </div>

      {/* Home plate */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <div className="w-4 h-4 bg-foreground/80 rotate-45 transform origin-center" />
      </div>

      {/* First base */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <div
          className={cn(
            'w-5 h-5 rounded-sm rotate-45 transition-colors',
            hasRunner('first')
              ? 'bg-primary shadow-lg shadow-primary/50'
              : 'bg-muted border border-muted-foreground/30'
          )}
        />
      </div>

      {/* Second base */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <div
          className={cn(
            'w-5 h-5 rounded-sm rotate-45 transition-colors',
            hasRunner('second')
              ? 'bg-primary shadow-lg shadow-primary/50'
              : 'bg-muted border border-muted-foreground/30'
          )}
        />
      </div>

      {/* Third base */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <div
          className={cn(
            'w-5 h-5 rounded-sm rotate-45 transition-colors',
            hasRunner('third')
              ? 'bg-primary shadow-lg shadow-primary/50'
              : 'bg-muted border border-muted-foreground/30'
          )}
        />
      </div>

      {/* Pitcher's mound */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  )
}
