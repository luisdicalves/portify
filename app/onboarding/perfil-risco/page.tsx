'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding, RiskProfile } from '@/lib/onboarding-context'
import { Screen, StepDots, ProgressBar, OptionItem, BtnPrimary } from '@/components/ui'

const OPTIONS: { id: RiskProfile; title: string; subtitle: string }[] = [
  { id: 'conservador',    title: 'Conservador',    subtitle: 'Prefiro segurança a retorno'          },
  { id: 'moderado',       title: 'Moderado',       subtitle: 'Equilíbrio entre risco e retorno'     },
  { id: 'arrojado',       title: 'Arrojado',       subtitle: 'Aceito volatilidade por mais retorno' },
  { id: 'muito-arrojado', title: 'Muito arrojado', subtitle: 'Maximizo retorno a longo prazo'       },
]

export default function PerfilRisco() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  return (
    <Screen>
      
      <div className="flex-1 flex flex-col px-6 py-5">
        <StepDots total={5} current={3} />
        <ProgressBar pct={60} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Perfil de risco
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Como reages a quedas na tua carteira?
        </p>

        <div className="flex flex-col gap-3 flex-1">
          {OPTIONS.map(o => (
            <OptionItem
              key={o.id}
              title={o.title}
              subtitle={o.subtitle}
              selected={data.risk === o.id}
              onClick={() => update({ risk: o.id })}
            />
          ))}
        </div>

        <div className="mt-6">
          <BtnPrimary
            disabled={!data.risk}
            onClick={() => router.push('/onboarding/objetivo')}>
            Continuar
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}
