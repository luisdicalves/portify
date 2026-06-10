'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Check } from 'lucide-react'
import { Screen, StatusBar, BtnPrimary } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const RISK_LABELS: Record<string, string> = {
  conservador: 'Conservador', moderado: 'Moderado',
  arrojado: 'Arrojado', 'muito-arrojado': 'Muito arrojado',
}
const OBJETIVO_LABELS: Record<string, string> = {
  independencia: 'Independência financeira', reforma: 'Reforma antecipada',
  rendimento: 'Rendimento passivo', crescimento: 'Crescimento de capital',
}
const TAXA_POR_RISCO: Record<string, [number, number]> = {
  conservador: [0.04, 0.06], moderado: [0.06, 0.08],
  arrojado: [0.08, 0.11], 'muito-arrojado': [0.10, 0.14],
}
const ANOS_POR_HORIZONTE: Record<string, number> = {
  '2anos': 2, '2a5': 5, '5a10': 10, '10mais': 20,
}

function calcFV(pmt: number, anos: number, r: number) {
  const n = anos * 12; const rm = r / 12
  return Math.round(pmt * ((Math.pow(1 + rm, n) - 1) / rm))
}
function fmt(n: number) { return n.toLocaleString('pt-PT') + ' €' }

export default function Pronto() {
  const router = useRouter()
  const { data } = useOnboarding()
  const [loading, setLoading] = useState(false)

  const risk      = data.risk      ?? 'arrojado'
  const horizonte = data.horizonte ?? '10mais'
  const anos      = ANOS_POR_HORIZONTE[horizonte] ?? 20
  const [tMin, tMax] = TAXA_POR_RISCO[risk] ?? [0.08, 0.11]
  const min = data.querPlano ? calcFV(data.investEuros, anos, tMin) : 0
  const max = data.querPlano ? calcFV(data.investEuros, anos, tMax) : 0

  const SUMARIO = [
    ['Perfil',    RISK_LABELS[risk] ?? '—'],
    ['Objetivo',  OBJETIVO_LABELS[data.objetivo ?? ''] ?? '—'],
    ...(data.querPlano ? [
      ['Investimento', `${data.investEuros} €/${data.periodo}`],
      ['Horizonte',    `${anos} anos`],
    ] : []),
  ]

  async function entrar() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('perfis').upsert({
          id:           user.id,
          nome:         data.nome,
          apelido:      data.apelido,
          experience:   data.experience,
          risk:         data.risk,
          objetivo:     data.objetivo,
          quer_plano:   data.querPlano,
          meta_euros:   data.metaEuros,
          invest_euros: data.investEuros,
          periodo:      data.periodo,
          horizonte:    data.horizonte,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      router.push('/dashboard')
    }
  }

  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center px-6 py-8 text-center">
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
            <p className="text-[28px] font-bold text-brand-600 mb-1">{fmt(min)} – {fmt(max)}</p>
            <p className="text-[12px] text-stone-400 mb-8">
              estimativa com CAGR entre {Math.round(tMin * 100)}% e {Math.round(tMax * 100)}%
            </p>
          </>
        ) : (
          <p className="text-[13px] text-stone-500 mb-8 leading-relaxed">
            A tua conta está pronta. Podes definir um plano a qualquer momento.
          </p>
        )}
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
        <BtnPrimary onClick={entrar} disabled={loading}>
          {loading ? 'A guardar...' : 'Entrar na app →'}
        </BtnPrimary>
      </div>
    </Screen>
  )
}
