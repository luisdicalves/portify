'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding, Experience } from '@/lib/onboarding-context'
import { Screen, StepDots, ProgressBar, OptionItem, BtnPrimary } from '@/components/ui'

const OPTIONS: { id: Experience; title: string; subtitle: string }[] = [
  { id: 'iniciante',  title: 'Iniciante',  subtitle: 'Estou a começar a investir'    },
  { id: 'intermedio', title: 'Intermédio', subtitle: 'Já tenho alguns ativos'        },
  { id: 'avancado',   title: 'Avançado',   subtitle: 'Invisto há vários anos'        },
]

export default function Experiencia() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  return (
    <Screen>
      
      <div className="flex-1 flex flex-col px-6 py-5">
        <StepDots total={7} current={3} />
        <ProgressBar pct={33} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Qual é a tua experiência?
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Personalizamos a app com base no teu perfil.
        </p>

        <div className="flex flex-col gap-3 flex-1">
          {OPTIONS.map(o => (
            <OptionItem
              key={o.id}
              title={o.title}
              subtitle={o.subtitle}
              selected={data.experience === o.id}
              onClick={() => update({ experience: o.id })}
            />
          ))}
        </div>

        <div className="mt-6">
          <BtnPrimary
            disabled={!data.experience}
            onClick={() => router.push('/onboarding/perfil-risco')}>
            Continuar
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}
