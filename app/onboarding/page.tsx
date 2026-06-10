'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { Screen, StatusBar, BtnPrimary, BtnGhost } from '@/components/ui'

export default function BemVindo() {
  const router = useRouter()

  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-4">

        {/* Logo */}
        <div className="w-[58px] h-[58px] bg-brand-50 rounded-[18px] flex items-center justify-center mb-4">
          <TrendingUp size={28} color="#1D9E75" strokeWidth={1.75} />
        </div>

        <h1 className="text-[26px] font-semibold text-stone-900 mb-2 tracking-tight">
          Portify
        </h1>
        <p className="text-[14px] text-stone-500 mb-10 text-center leading-relaxed">
          O teu património, inteligente.
        </p>

        {/* Destaques */}
        <div className="w-full bg-stone-50 rounded-2xl p-4 mb-8 space-y-3">
          {[
            ['Acompanha', 'ações, ETFs e dividendos num só lugar'],
            ['Analisa',   'recebe recomendações personalizadas por IA'],
            ['Planeia',   'define objetivos e acompanha o progresso'],
          ].map(([bold, rest]) => (
            <div key={bold} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              </div>
              <p className="text-[13px] text-stone-600 leading-snug">
                <span className="font-medium text-stone-900">{bold}</span> — {rest}
              </p>
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <BtnPrimary onClick={() => router.push('/onboarding/criar-conta')}>
            Criar conta gratuita
          </BtnPrimary>
          <BtnGhost onClick={() => router.push('/dashboard')}>
            Já tenho conta
          </BtnGhost>
        </div>

        <p className="text-[11px] text-stone-400 mt-4">
          Sem cartão de crédito necessário
        </p>
      </div>
    </Screen>
  )
}
