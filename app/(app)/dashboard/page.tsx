'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, ChevronRight, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { carteira, evolucao, alocacao, recomendacoes } from '@/lib/mock-data'

const TIME_TABS = ['1M','3M','6M','1A','Tudo']

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 0 }) + ' €'
}

function MetricCard({ label, value, sub, green }: {
  label: string; value: string; sub?: string; green?: boolean
}) {
  return (
    <div className="bg-stone-50 rounded-xl p-3">
      <p className="text-[11px] text-stone-500 mb-1">{label}</p>
      <p className={`text-[16px] font-semibold ${green ? 'text-brand-600' : 'text-stone-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function getIniciais(nome: string, apelido: string) {
  const n = nome?.trim()?.[0]?.toUpperCase() ?? ''
  const a = apelido?.trim()?.[0]?.toUpperCase() ?? ''
  return (n + a) || '?'
}

export default function Dashboard() {
  const router = useRouter()
  const [nomeUtilizador, setNomeUtilizador] = useState('...')
  const [iniciais,       setIniciais]       = useState('...')
  const riscos       = recomendacoes.filter(r => r.tipo === 'risco')
  const oportunidades= recomendacoes.filter(r => r.tipo === 'oportunidade')

  useEffect(() => {
    async function carregarUtilizador() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, apelido')
        .eq('id', session.user.id)
        .single()

      if (perfil?.nome) {
        setNomeUtilizador(perfil.nome)
        setIniciais(getIniciais(perfil.nome, perfil.apelido ?? ''))
      } else {
        // fallback para metadata do auth
        const meta = session.user.user_metadata
        const nome = meta?.nome ?? session.user.email?.split('@')[0] ?? '?'
        const apelido = meta?.apelido ?? ''
        setNomeUtilizador(nome)
        setIniciais(getIniciais(nome, apelido))
      }
    }
    carregarUtilizador()
  }, [router])

  return (
    <div className="pb-2">
      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <div>
          <p className="text-[12px] text-stone-500">Bom dia,</p>
          <p className="text-[17px] font-semibold text-stone-900">{nomeUtilizador}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/notificacoes')} className="relative w-9 h-9 flex items-center justify-center">
            <Bell size={22} strokeWidth={1.75} color="#5F5E5A" />
            <span className="absolute top-0.5 right-0.5 w-[7px] h-[7px] bg-red-500 rounded-full" />
          </button>
          <button onClick={() => router.push('/perfil')}
            className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-[12px] font-semibold text-brand-800">
            {iniciais}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[12px] text-stone-500 mb-1">Valor atual da carteira</p>
          <p className="text-[28px] font-bold text-stone-900 leading-none mb-1">{fmt(carteira.valorAtual)}</p>
          <div className="flex items-center gap-1 text-brand-600 text-[13px] mb-4">
            <TrendingUp size={14} strokeWidth={2} />
            <span>+1.240 € este mês (+4,5%)</span>
          </div>
          <div className="flex gap-1 mb-3">
            {TIME_TABS.map(t => (
              <button key={t} className={`flex-1 text-[11px] py-[5px] rounded-md transition-colors
                ${t === '3M' ? 'bg-brand-50 text-brand-800 font-medium' : 'text-stone-500 hover:bg-stone-50'}`}>
                {t}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={evolucao} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" hide />
              <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid #E8E6E0' }}
                formatter={(v: number) => [fmt(v), '']} />
              <Area type="monotone" dataKey="investido" stroke="#D3D1C7" strokeWidth={1}
                strokeDasharray="4 3" fill="none" dot={false} />
              <Area type="monotone" dataKey="atual" stroke="#1D9E75" strokeWidth={2}
                fill="url(#gradAtual)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Resumo</p>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Total investido"  value={fmt(carteira.totalInvestido)} />
            <MetricCard label="Ganho total"       value={`+${fmt(carteira.ganhoTotal)}`} sub={`+${carteira.ganhoPercent}%`} green />
            <MetricCard label="Dividendos (ano)" value={fmt(carteira.dividendosAno)} />
            <MetricCard label="CAGR"              value={`${carteira.cagr}%`} green />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Alocação</p>
          <div className="flex items-center gap-4">
            <div className="relative w-[72px] h-[72px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
                {(() => {
                  let offset = 0
                  return alocacao.map(a => {
                    const dash = (a.valor / 100) * 100
                    const el = (
                      <circle key={a.nome} cx="18" cy="18" r="15.9" fill="none"
                        stroke={a.cor} strokeWidth="4"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset} />
                    )
                    offset += dash
                    return el
                  })
                })()}
              </svg>
            </div>
            <div className="flex flex-col gap-[5px]">
              {alocacao.map(a => (
                <div key={a.nome} className="flex items-center gap-2 text-[12px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.cor }} />
                  <span className="text-stone-600">{a.nome}</span>
                  <span className="font-medium text-stone-900 ml-auto">{a.valor}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-[26px] h-[26px] bg-brand-400 rounded-[8px] flex items-center justify-center">
                <span className="text-white text-[13px]">✦</span>
              </div>
              <p className="text-[13px] font-medium text-stone-900">Recomendações para ti</p>
            </div>
            <button onClick={() => router.push('/para-ti')}
              className="flex items-center gap-0.5 text-[12px] text-brand-600 font-medium">
              ver todas <ChevronRight size={13} />
            </button>
          </div>
          {[...riscos.slice(0,1), ...oportunidades.slice(0,1)].map(r => (
            <button key={r.id} onClick={() => router.push('/para-ti')}
              className={`w-full text-left rounded-xl p-3 mb-2 last:mb-0 flex gap-3 items-start border
                ${r.tipo === 'risco' ? 'bg-amber-50 border-amber-200' : 'bg-brand-50 border-brand-100'}`}>
              <span className="text-[16px] mt-0.5">{r.tipo === 'risco' ? '⚠' : '💡'}</span>
              <div>
                <p className={`text-[12px] font-medium ${r.tipo === 'risco' ? 'text-amber-800' : 'text-brand-800'}`}>
                  {r.titulo}
                </p>
                <p className={`text-[11px] mt-0.5 ${r.tipo === 'risco' ? 'text-amber-700' : 'text-brand-600'}`}>
                  {r.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
