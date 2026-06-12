'use client'

import { BottomNav } from '@/components/BottomNav'
import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex justify-center">
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100dvh' }}>
        <main className="flex-1 overflow-y-auto pb-[64px]">
          {children}
        </main>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-50">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
