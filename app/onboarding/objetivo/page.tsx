'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding, Objetivo } from '@/lib/onboarding-context'
import { Screen, StepDots, ProgressBar, OptionItem, BtnPrimary } from '@/components/ui'

const OPTIONS: { id: Objetivo; title: string; subtitle: string }[] = [
  { id: 'independencia', title: 'Independência financeira', subtitle: 'Viver sem depender do salário'   },
  { id: 'reforma',       title: 'Reforma antecipada',       subtitle: 'Reforma antes dos 60 anos'       },
  { id: 'rendimento',    title: 'Rendimento passivo',       subtitle: 'Dividendos regulares'            },
  { id: 'crescimento',   title: 'Crescimento de capital',   subtitle: 'Maximizar o valor da carteira'   },
]

export default function ObjetivoPrincipal() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  return (
    <Screen>
      
      <div className="flex-1 flex flex-col px-6 py-5">
        <StepDots total={5} current={4} />
        <ProgressBar pct={80} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Objetivo principal
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          O que queres alcançar com os teus investimentos?
        </p>

        <div className="flex flex-col gap-3 flex-1">
          {OPTIONS.map(o => (
            <OptionItem
              key={o.id}
              title={o.title}
              subtitle={o.subtitle}
              selected={data.objetivo === o.id}
              onClick={() => update({ objetivo: o.id })}
            />
          ))}
        </div>

        <div className="mt-6">
          <BtnPrimary
            disabled={!data.objetivo}
            onClick={() => router.push('/onboarding/quer-plano')}>
            Continuar
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}
