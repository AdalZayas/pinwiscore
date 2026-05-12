'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/lib/game-store'
import { cn } from '@/lib/utils'

export function BatterTransition() {
  const { showBatterTransition, nextBatterName, dismissBatterTransition } = useGameStore()

  useEffect(() => {
    if (showBatterTransition) {
      const timer = setTimeout(() => {
        dismissBatterTransition()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showBatterTransition, dismissBatterTransition])

  if (!showBatterTransition) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      onClick={dismissBatterTransition}
    >
      <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="text-sm text-muted-foreground uppercase tracking-widest">Now Batting</div>
        <div className="text-4xl font-bold text-foreground">{nextBatterName}</div>
        <div className="flex justify-center">
          <div className="w-16 h-1 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
