'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding, TipoAtivo } from '@/lib/onboarding-context'
import { Screen, StepDots, ProgressBar, BtnPrimary } from '@/components/ui'
import { Check } from 'lucide-react'

const OPCOES: { id: TipoAtivo; emoji: string; title: string; subtitle: string }[] = [
  { id: 'acoes',          emoji: '📈', title: 'Ações',           subtitle: 'Empresas cotadas em bolsa'          },
  { id: 'etfs',           emoji: '🧺', title: 'ETFs',            subtitle: 'Fundos de índice diversificados'    },
  { id: 'reits',          emoji: '🏢', title: 'REITs',           subtitle: 'Fundos de investimento imobiliário' },
  { id: 'obrigacoes',     emoji: '📄', title: 'Obrigações',      subtitle: 'Dívida pública e corporativa'       },
  { id: 'cripto',         emoji: '🪙', title: 'Criptomoedas',    subtitle: 'Ativos digitais descentralizados'   },
  { id: 'materias-primas',emoji: '🛢️', title: 'Matérias-primas', subtitle: 'Ouro, petróleo, prata, etc.'        },
]

export default function TiposAtivo() {
  const router = useRouter()
  const { data, update } = useOnboarding()
  const selecionados = data.tiposAtivo

  function toggle(id: TipoAtivo) {
    if (selecionados.includes(id)) {
      update({ tiposAtivo: selecionados.filter(t => t !== id) })
    } else {
      update({ tiposAtivo: [...selecionados, id] })
    }
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col px-6 py-5">
        <StepDots total={7} current={2} />
        <ProgressBar pct={25} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          O que queres gerir?
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Escolhe os tipos de ativos que pretendes acompanhar. Podes selecionar mais do que um.
        </p>

        <div className="flex flex-col gap-2.5 flex-1">
          {OPCOES.map(o => {
            const sel = selecionados.includes(o.id)
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98]
                  ${sel
                    ? 'bg-brand-50 border-brand-400'
                    : 'bg-white border-stone-200 active:bg-stone-50'
                  }`}>
                <span className="text-[22px] flex-shrink-0">{o.emoji}</span>
                <div className="flex-1 text-left">
                  <p className={`text-[14px] font-semibold ${sel ? 'text-brand-900' : 'text-stone-900'}`}>{o.title}</p>
                  <p className={`text-[11px] mt-0.5 ${sel ? 'text-brand-600' : 'text-stone-400'}`}>{o.subtitle}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${sel ? 'bg-brand-400 border-brand-400' : 'border-stone-300'}`}>
                  {sel && <Check size={11} color="white" strokeWidth={3}/>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <BtnPrimary
            disabled={selecionados.length === 0}
            onClick={() => router.push('/onboarding/experiencia')}>
            Continuar {selecionados.length > 0 && `(${selecionados.length} selecionado${selecionados.length > 1 ? 's' : ''})`}
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}
