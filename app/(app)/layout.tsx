import { BottomNav } from '@/components/BottomNav'
import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center">
      <div className="w-full max-w-sm min-h-screen flex flex-col bg-stone-50">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
