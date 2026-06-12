import { BottomNav } from '@/components/BottomNav'
import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col bg-stone-50">
        {/* Área de scroll */}
        <div className="flex-1 overflow-y-auto pb-2">
          {children}
        </div>
        {/* Barra fixa no fundo */}
        <div className="flex-shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
