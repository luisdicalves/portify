'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/onboarding-context'
import { Check } from 'lucide-react'
import { Screen, BtnPrimary } from '@/components/ui'

const BENEFICIOS = [
  'Acompanha o progresso do teu objetivo financeiro',
  'Recebe uma projeção personalizada por IA',
  'Sabe exatamente quanto e quando investir',
]

export default function QuerPlano() {
  const router = useRouter()
  const { update } = useOnboarding()

  function escolher(quer: boolean) {
    update({ querPlano: quer })
    router.push(quer ? '/onboarding/definir-plano' : '/onboarding/pronto')
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col px-6 py-5">
        <div className="h-[3px] bg-stone-200 rounded-full mb-6">
          <div className="h-full bg-brand-400 rounded-full w-[85%]" />
        </div>

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Queres definir um plano?
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Um plano ajuda-te a saber quanto investir e quando atinges os teus objetivos.
        </p>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 space-y-3">
          {BENEFICIOS.map(b => (
            <div key={b} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} color="white" strokeWidth={3} />
              </div>
              <p className="text-[13px] text-brand-800 leading-snug">{b}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3">
          <BtnPrimary onClick={() => escolher(true)}>
            Sim, quero definir um plano
          </BtnPrimary>
          <button
            onClick={() => escolher(false)}
            className="w-full text-center text-[13px] text-stone-400 py-2">
            Saltar este passo
          </button>
        </div>
      </div>
    </Screen>
  )
}
