'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/onboarding-context'
import { Check } from 'lucide-react'
import { Screen, StatusBar, BtnPrimary } from '@/components/ui'

const RISK_LABELS: Record<string, string> = {
  conservador:    'Conservador',
  moderado:       'Moderado',
  arrojado:       'Arrojado',
  'muito-arrojado': 'Muito arrojado',
}

const OBJETIVO_LABELS: Record<string, string> = {
  independencia: 'Independência financeira',
  reforma:       'Reforma antecipada',
  rendimento:    'Rendimento passivo',
  crescimento:   'Crescimento de capital',
}

/* Projeção simples: FV = PMT × [((1+r)^n - 1) / r] */
function calcProjecao(pmt: number, anos: number, taxaMin: number, taxaMax: number) {
  function fv(r: number) {
    const n = anos * 12
    const rm = r / 12
    return Math.round(pmt * ((Math.pow(1 + rm, n) - 1) / rm))
  }
  return { min: fv(taxaMin), max: fv(taxaMax) }
}

const TAXA_POR_RISCO: Record<string, [number, number]> = {
  conservador:    [0.04, 0.06],
  moderado:       [0.06, 0.08],
  arrojado:       [0.08, 0.11],
  'muito-arrojado': [0.10, 0.14],
}

const ANOS_POR_HORIZONTE: Record<string, number> = {
  '2anos': 2, '2a5': 5, '5a10': 10, '10mais': 20,
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT') + ' €'
}

export default function Pronto() {
  const router = useRouter()
  const { data } = useOnboarding()

  const risk      = data.risk      ?? 'arrojado'
  const horizonte = data.horizonte ?? '10mais'
  const anos      = ANOS_POR_HORIZONTE[horizonte]
  const [tMin, tMax] = TAXA_POR_RISCO[risk]
  const { min, max } = data.querPlano
    ? calcProjecao(data.investEuros, anos, tMin, tMax)
    : { min: 0, max: 0 }

  const SUMARIO = [
    ['Perfil',       RISK_LABELS[risk]          ?? '—'],
    ['Objetivo',     OBJETIVO_LABELS[data.objetivo ?? ''] ?? '—'],
    ...(data.querPlano ? [
      ['Investimento', `${data.investEuros} €/${data.periodo}`],
      ['Horizonte',    `${anos} anos`],
    ] : []),
  ]

  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center px-6 py-8 text-center">

        {/* Ícone de sucesso */}
        <div className="w-16 h-16 bg-brand-50 rounded-[20px] flex items-center justify-center mb-5">
          <Check size={32} color="#1D9E75" strokeWidth={2} />
        </div>

        <h2 className="text-[22px] font-semibold text-stone-900 mb-2">
          Tudo pronto, {data.nome || 'João'}!
        </h2>

        {data.querPlano && min > 0 ? (
          <>
            <p className="text-[13px] text-stone-500 leading-relaxed mb-2">
              Com <strong className="text-stone-900">{data.investEuros} €/{data.periodo}</strong> durante{' '}
              <strong className="text-stone-900">{anos} anos</strong>, podes atingir entre
            </p>
            <p className="text-[28px] font-bold text-brand-600 mb-1">
              {fmt(min)} – {fmt(max)}
            </p>
            <p className="text-[12px] text-stone-400 mb-8">
              estimativa com CAGR entre {Math.round(tMin * 100)}% e {Math.round(tMax * 100)}%
            </p>
          </>
        ) : (
          <p className="text-[13px] text-stone-500 mb-8 leading-relaxed">
            A tua conta está pronta. Podes definir um plano de investimento a qualquer momento.
          </p>
        )}

        {/* Sumário de perfil */}
        <div className="w-full bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 text-left">
          {SUMARIO.map(([label, value], i) => (
            <div key={label}
              className={`flex justify-between items-center py-[6px] text-[13px]
                ${i < SUMARIO.length - 1 ? 'border-b border-brand-100' : ''}`}>
              <span className="text-brand-600">{label}</span>
              <span className="font-medium text-brand-800">{value}</span>
            </div>
          ))}
        </div>

        <BtnPrimary onClick={() => router.push('/dashboard')}>
          Entrar na app →
        </BtnPrimary>
      </div>
    </Screen>
  )
}
