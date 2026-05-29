import React from 'react'
import { cn } from '../utils/cn'

export function GlassCard({
  title,
  value,
  accent,
  custom,
}: {
  title: string
  value: string
  accent?: 'orange' | 'blue'
  custom?: React.ReactNode
}) {
  const accentClass =
    accent === 'orange'
      ? 'from-brand-orange to-brand-blue'
      : 'from-brand-blue to-brand-orange'

  return (
    <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600 font-medium">{title}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
        </div>
        <div
          className={cn(
            'h-10 w-10 rounded-2xl bg-gradient-to-br ring-1 ring-white/30',
            accentClass,
          )}
        />
      </div>
      {custom ? <div className="mt-4">{custom}</div> : null}
    </div>
  )
}


