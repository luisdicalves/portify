'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/onboarding-context'
import { Screen, StepDots, ProgressBar, BtnPrimary } from '@/components/ui'
import { Check } from 'lucide-react'

const SETORES = [
  { id: 'tecnologia',      emoji: '💻', label: 'Tecnologia'              },
  { id: 'saude',           emoji: '🏥', label: 'Saúde & Farmacêutica'    },
  { id: 'financas',        emoji: '🏦', label: 'Finanças & Bancos'       },
  { id: 'energia',         emoji: '⚡', label: 'Energia'                 },
  { id: 'consumo',         emoji: '🛒', label: 'Consumo & Retalho'       },
  { id: 'industria',       emoji: '🏭', label: 'Indústria'               },
  { id: 'imobiliario',     emoji: '🏠', label: 'Imobiliário'             },
  { id: 'utilidades',      emoji: '💧', label: 'Utilidades'              },
  { id: 'materiais',       emoji: '🪨', label: 'Materiais Básicos'       },
  { id: 'comunicacoes',    emoji: '📡', label: 'Comunicações & Media'    },
  { id: 'aeroespacial',    emoji: '🚀', label: 'Aeroespacial & Defesa'   },
  { id: 'alimentacao',     emoji: '🍎', label: 'Alimentação & Bebidas'   },
  { id: 'automobilismo',   emoji: '🚗', label: 'Automóvel & Mobilidade'  },
  { id: 'semicondutores',  emoji: '🔬', label: 'Semicondutores'          },
  { id: 'ia-robotica',     emoji: '🤖', label: 'IA & Robótica'          },
]

export default function Setores() {
  const router = useRouter()
  const { data, update } = useOnboarding()
  const selecionados = data.setores

  function toggle(id: string) {
    if (selecionados.includes(id)) {
      update({ setores: selecionados.filter(s => s !== id) })
    } else {
      update({ setores: [...selecionados, id] })
    }
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        <StepDots total={7} current={5} />
        <ProgressBar pct={80} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Setores de interesse
        </h2>
        <p className="text-[13px] text-stone-500 mb-5 leading-relaxed">
          Quais os setores em que tens mais interesse? Usamos isso para personalizar as tuas recomendações.
        </p>

        <div className="flex flex-col gap-2 flex-1">
          {SETORES.map(s => {
            const sel = selecionados.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98]
                  ${sel
                    ? 'bg-brand-50 border-brand-400'
                    : 'bg-white border-stone-200 active:bg-stone-50'
                  }`}>
                <span className="text-[18px] w-6 flex-shrink-0">{s.emoji}</span>
                <span className={`flex-1 text-left text-[14px] font-medium ${sel ? 'text-brand-900' : 'text-stone-700'}`}>
                  {s.label}
                </span>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${sel ? 'bg-brand-400 border-brand-400' : 'border-stone-300'}`}>
                  {sel && <Check size={11} color="white" strokeWidth={3}/>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-4 pb-2 sticky bottom-0 bg-white/90 backdrop-blur-sm">
          <BtnPrimary
            onClick={() => router.push('/onboarding/quer-plano')}>
            {selecionados.length === 0
              ? 'Saltar este passo'
              : `Continuar (${selecionados.length} selecionado${selecionados.length > 1 ? 's' : ''})`}
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}
