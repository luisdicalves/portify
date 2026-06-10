'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding, Periodo, Horizonte } from '@/lib/onboarding-context'
import { Screen, Chip, BtnPrimary } from '@/components/ui'

const BUDGETS: { label: string; value: number }[] = [
  { label: '100 €',   value: 100  },
  { label: '250 €',   value: 250  },
  { label: '300 €',   value: 300  },
  { label: '500 €',   value: 500  },
  { label: '1.000 €', value: 1000 },
]
const PERIODOS: { label: string; value: Periodo }[] = [
  { label: 'Semanal',    value: 'semanal'    },
  { label: 'Mensal',     value: 'mensal'     },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Anual',      value: 'anual'      },
]
const HORIZONTES: { label: string; value: Horizonte }[] = [
  { label: '< 2 anos',    value: '2anos' },
  { label: '2 – 5 anos',  value: '2a5'   },
  { label: '5 – 10 anos', value: '5a10'  },
  { label: '> 10 anos',   value: '10mais'},
]

export default function DefinirPlano() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  return (
    <Screen>
      
      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        <div className="h-[3px] bg-stone-200 rounded-full mb-6">
          <div className="h-full bg-brand-400 rounded-full w-[92%]" />
        </div>

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">
          Define o teu plano
        </h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Podes alterar estes valores em qualquer altura.
        </p>

        {/* Objetivo */}
        <p className="text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
          Objetivo financeiro
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 mb-5
          flex items-center gap-2">
          <span className="text-[14px] text-stone-400">€</span>
          <input
            type="number"
            value={data.metaEuros}
            onChange={e => update({ metaEuros: Number(e.target.value) })}
            className="flex-1 bg-transparent text-[18px] font-semibold text-stone-900
              focus:outline-none"
          />
        </div>

        {/* Orçamento */}
        <p className="text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
          Investimento por período
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {BUDGETS.map(b => (
            <Chip
              key={b.value}
              label={b.label}
              selected={data.investEuros === b.value}
              onClick={() => update({ investEuros: b.value })}
            />
          ))}
        </div>

        {/* Periodicidade */}
        <p className="text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
          Periodicidade
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {PERIODOS.map(p => (
            <Chip
              key={p.value}
              label={p.label}
              selected={data.periodo === p.value}
              onClick={() => update({ periodo: p.value })}
            />
          ))}
        </div>

        {/* Horizonte */}
        <p className="text-[12px] font-medium text-stone-500 uppercase tracking-wider mb-2">
          Horizonte temporal
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {HORIZONTES.map(h => (
            <Chip
              key={h.value}
              label={h.label}
              selected={data.horizonte === h.value}
              onClick={() => update({ horizonte: h.value })}
            />
          ))}
        </div>

        <BtnPrimary onClick={() => router.push('/onboarding/pronto')}>
          Ver projeção
        </BtnPrimary>
      </div>
    </Screen>
  )
}
