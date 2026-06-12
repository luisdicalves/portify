'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Check, PartyPopper } from 'lucide-react'
import { Screen, BtnPrimary } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const RISK_LABELS: Record<string, string> = {
  conservador: 'Conservador', moderado: 'Moderado',
  arrojado: 'Arrojado', 'muito-arrojado': 'Muito arrojado',
}
const OBJETIVO_LABELS: Record<string, string> = {
  independencia: 'Independência financeira', reforma: 'Reforma antecipada',
  rendimento: 'Rendimento passivo', crescimento: 'Crescimento de capital',
}
const EXPERIENCE_LABELS: Record<string, string> = {
  iniciante: 'Iniciante', intermedio: 'Intermédio', avancado: 'Avançado',
}
const TIPO_LABELS: Record<string, string> = {
  acoes: 'Ações', etfs: 'ETFs', reits: 'REITs',
  obrigacoes: 'Obrigações', cripto: 'Cripto', 'materias-primas': 'Mat. Primas',
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

function ToastSucesso({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-stone-900 text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl">
        <div className="w-8 h-8 bg-brand-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Check size={16} color="white" strokeWidth={3}/>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold">Conta criada com sucesso! 🎉</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Bem-vindo ao Portify</p>
        </div>
      </div>
    </div>
  )
}

export default function Pronto() {
  const router = useRouter()
  const { data } = useOnboarding()
  const [loading,    setLoading]    = useState(false)
  const [mostrarToast, setMostrarToast] = useState(false)

  const risk      = data.risk      ?? 'arrojado'
  const horizonte = data.horizonte ?? '10mais'
  const anos      = ANOS_POR_HORIZONTE[horizonte] ?? 20
  const [tMin, tMax] = TAXA_POR_RISCO[risk] ?? [0.08, 0.11]
  const min = data.querPlano ? calcFV(data.investEuros, anos, tMin) : 0
  const max = data.querPlano ? calcFV(data.investEuros, anos, tMax) : 0

  const SUMARIO = [
    ['ID', `@${data.userId || '—'}`],
    ['Experiência', EXPERIENCE_LABELS[data.experience ?? ''] ?? '—'],
    ['Perfil',      RISK_LABELS[risk] ?? '—'],
    ['Objetivo',    OBJETIVO_LABELS[data.objetivo ?? ''] ?? '—'],
    ...(data.tiposAtivo.length > 0 ? [
      ['Ativos', data.tiposAtivo.map(t => TIPO_LABELS[t] ?? t).join(', ')],
    ] : []),
    ...(data.querPlano ? [
      ['Investimento', `${data.investEuros} €/${data.periodo}`],
      ['Horizonte',    `${anos} anos`],
    ] : []),
  ]

  async function finalizar() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from('perfis').upsert({
          id:           session.user.id,
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
          tipos_ativo:  data.tiposAtivo,
          setores:      data.setores,
        })
      }
      setMostrarToast(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e) {
      console.error(e)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      {mostrarToast && <ToastSucesso onDone={() => setMostrarToast(false)} />}

      <div className="flex-1 flex flex-col items-center px-6 py-8 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-[20px] flex items-center justify-center mb-5">
          <PartyPopper size={30} color="#1D9E75" strokeWidth={1.75} />
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
            <p className="text-[12px] text-stone-400 mb-6">
              estimativa com CAGR entre {Math.round(tMin * 100)}% e {Math.round(tMax * 100)}%
            </p>
          </>
        ) : (
          <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
            A tua conta está pronta. Podes definir um plano a qualquer momento.
          </p>
        )}
        <div className="w-full bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 text-left">
          {SUMARIO.map(([label, value], i) => (
            <div key={label}
              className={`flex justify-between items-start py-[6px] text-[13px] gap-3
                ${i < SUMARIO.length - 1 ? 'border-b border-brand-100' : ''}`}>
              <span className="text-brand-600 flex-shrink-0">{label}</span>
              <span className="font-medium text-brand-800 text-right">{value}</span>
            </div>
          ))}
        </div>
        <BtnPrimary onClick={finalizar} disabled={loading}>
          {loading ? 'A guardar...' : 'Finalizar e entrar'}
        </BtnPrimary>
      </div>
    </Screen>
  )
}
