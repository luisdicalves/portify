'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, History, Coins } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/lib/supabase'

type Transacao = {
  id: string; ticker: string; nome: string; tipo: string
  unidades: number; preco_medio: number; moeda: string; data_compra?: string
}
type PosicaoAgregada = { ticker: string; unidades: number; preco_medio: number; moeda: string }
type DadosDividendo = {
  ticker: string; nome: string; dividendRate: number; dividendYield: number
  exDividendDate: string | null; dividendDate: string | null; moeda: string
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS_SEMANA_PT = ['S','T','Q','Q','S','S','D'] // segunda-domingo

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function agregarPosicoes(transacoes: Transacao[]): PosicaoAgregada[] {
  const mapa = new Map<string, PosicaoAgregada>()
  for (const t of transacoes) {
    const ex = mapa.get(t.ticker)
    if (!ex) {
      mapa.set(t.ticker, { ticker: t.ticker, unidades: t.unidades, preco_medio: t.preco_medio, moeda: t.moeda })
    } else {
      const novas = ex.unidades + t.unidades
      if (novas <= 0) { mapa.delete(t.ticker) }
      else {
        const custoTotal = ex.preco_medio * ex.unidades + t.preco_medio * t.unidades
        mapa.set(t.ticker, { ...ex, unidades: novas, preco_medio: custoTotal / novas })
      }
    }
  }
  return Array.from(mapa.values()).filter(p => p.unidades > 0)
}

export default function Dividendos() {
  const router = useRouter()
  const [posicoes,    setPosicoes]    = useState<PosicaoAgregada[]>([])
  const [dividendos,  setDividendos]  = useState<Record<string, DadosDividendo>>({})
  const [carregando,  setCarregando]  = useState(true)
  const [mesAtual,    setMesAtual]    = useState(new Date())

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const { data: trans } = await supabase.from('posicoes').select('*').order('data_compra', { ascending: true })
      const pos = agregarPosicoes((trans ?? []) as Transacao[])
      setPosicoes(pos)

      if (pos.length > 0) {
        const tickers = pos.map(p => p.ticker).join(',')
        try {
          const r = await fetch(`/api/dividendos?tickers=${encodeURIComponent(tickers)}`)
          if (r.ok) {
            const { dados } = await r.json()
            const mapa: Record<string, DadosDividendo> = {}
            for (const d of dados as DadosDividendo[]) mapa[d.ticker] = d
            setDividendos(mapa)
          }
        } catch {}
      }
      setCarregando(false)
    }
    load()
  }, [router])

  /* ─── Cálculos: Resumo ─── */
  const custoTotal = posicoes.reduce((s, p) => s + p.preco_medio * p.unidades, 0)

  // Dividendo anual estimado por posição (valor anual na moeda da posição, assumido ~EUR para simplificar)
  const dividendoAnualPorPosicao = posicoes.map(p => {
    const d = dividendos[p.ticker]
    const anual = d ? d.dividendRate * p.unidades : 0
    return { ticker: p.ticker, nome: d?.nome ?? p.ticker, anual, dadosDiv: d }
  })

  const totalAnual = dividendoAnualPorPosicao.reduce((s, p) => s + p.anual, 0)
  const totalMensalMedio = totalAnual / 12
  const yieldOnCost = custoTotal > 0 ? (totalAnual / custoTotal) * 100 : 0

  /* ─── Projeção de pagamentos futuros (12 meses), com base na cadência real de cada ticker ───
     Para cada posição com dividendDate estimada, projeta pagamentos repetindo de
     ~3 em 3 meses (cadência trimestral típica) durante os próximos 12 meses.
     Estes pagamentos são a fonte única tanto da Previsão mensal como dos Próximos pagamentos,
     garantindo coerência entre os dois blocos. */
  const hoje = new Date()
  const horizonteFim = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate())

  type PagamentoProjetado = { ticker: string; nome: string; data: Date; valor: number }
  const pagamentosProjetados: PagamentoProjetado[] = []

  for (const p of dividendoAnualPorPosicao) {
    if (!p.dadosDiv?.dividendDate || p.anual <= 0) continue
    const posicao = posicoes.find(x => x.ticker === p.ticker)!
    const valorPorPagamento = p.dadosDiv.dividendRate / 4 * posicao.unidades // trimestral típico

    let dataPagamento = new Date(p.dadosDiv.dividendDate)
    // recuar até à primeira ocorrência futura/atual a partir de hoje
    while (dataPagamento < new Date(hoje.getFullYear(), hoje.getMonth(), 1)) {
      dataPagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 3, dataPagamento.getDate())
    }
    // gerar ocorrências trimestrais até ao fim do horizonte
    while (dataPagamento <= horizonteFim) {
      pagamentosProjetados.push({
        ticker: p.ticker, nome: p.nome, data: new Date(dataPagamento), valor: valorPorPagamento,
      })
      dataPagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 3, dataPagamento.getDate())
    }
  }
  pagamentosProjetados.sort((a, b) => a.data.getTime() - b.data.getTime())

  /* ─── Previsão mensal: soma dos pagamentos projetados por mês (12 meses a partir de hoje) ─── */
  const previsaoMensal = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const total = pagamentosProjetados
      .filter(p => p.data.getFullYear() === d.getFullYear() && p.data.getMonth() === d.getMonth())
      .reduce((s, p) => s + p.valor, 0)
    return { mes: MESES_PT[d.getMonth()], val: Math.round(total * 100) / 100 }
  })
  const maxVal = Math.max(...previsaoMensal.map(d => d.val), 1)

  /* ─── Próximos pagamentos: primeiras ocorrências projetadas ─── */
  const proximosPagamentos = pagamentosProjetados.slice(0, 5)

  /* ─── Calendário do mês ─── */
  const ano = mesAtual.getFullYear()
  const mes = mesAtual.getMonth()
  const nomeMes = mesAtual.toLocaleDateString('pt-PT', { month: 'long' })
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const primeiroDiaSemana = (new Date(ano, mes, 1).getDay() + 6) % 7 // 0 = segunda
  const diasArray = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  const exDividendDias = new Set<number>()
  const pagamentoDias  = new Set<number>()
  for (const p of dividendoAnualPorPosicao) {
    if (p.dadosDiv?.exDividendDate) {
      const d = new Date(p.dadosDiv.exDividendDate)
      if (d.getFullYear() === ano && d.getMonth() === mes) exDividendDias.add(d.getDate())
    }
    if (p.dadosDiv?.dividendDate) {
      const d = new Date(p.dadosDiv.dividendDate)
      if (d.getFullYear() === ano && d.getMonth() === mes) pagamentoDias.add(d.getDate())
    }
  }
  const ehHoje = (dia: number) =>
    ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate()

  const semDados = !carregando && posicoes.length > 0 &&
    Object.keys(dividendos).length === 0

  return (
    <div className="pb-2">
      {/* Top bar */}
      <PageHeader title="Dividendos" />

      {/* Abas (submenu do portfólio) */}
      <div className="bg-white px-5 pb-2 border-b border-stone-100">
        <div className="flex gap-1">
          <button onClick={()=>router.push('/portfolio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-white border-stone-200 text-stone-600">
            <BarChart2 size={12}/>Posições
          </button>
          <button onClick={()=>router.push('/portfolio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-white border-stone-200 text-stone-600">
            <History size={12}/>Histórico
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-brand-50 border-brand-400 text-brand-800 font-medium">
            <Coins size={12}/>Dividendos
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {carregando ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <div className="h-4 w-24 bg-stone-100 rounded animate-pulse"/>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-stone-50 rounded-xl animate-pulse"/>)}
            </div>
          </div>
        ) : posicoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
            <p className="text-[13px] text-stone-500">Adiciona posições no portfólio para ver os teus dividendos.</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Resumo</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Por mês (média)', value: fmt(totalMensalMedio), green: true },
                  { label: 'Por ano (est.)',  value: fmt(totalAnual),       green: true },
                  { label: 'Yield on Cost',   value: yieldOnCost.toLocaleString('pt-PT',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%', green: false },
                ].map(m => (
                  <div key={m.label} className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] text-stone-500 mb-1">{m.label}</p>
                    <p className={`text-[14px] font-semibold ${m.green ? 'text-brand-600' : 'text-stone-900'}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
              {semDados && (
                <p className="text-[11px] text-stone-400 mt-3">
                  Não foi possível obter dados de dividendos para os teus tickers neste momento.
                </p>
              )}
            </div>

            {/* Previsão mensal */}
            {pagamentosProjetados.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                  Previsão mensal (próximos 12 meses)
                </p>
                <div className="space-y-[6px]">
                  {previsaoMensal.map((d, i) => (
                    <div key={`${d.mes}-${i}`} className="flex items-center gap-3">
                      <p className="text-[11px] text-stone-500 w-7">{d.mes}</p>
                      <div className="flex-1 h-[13px] bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${(d.val / maxVal) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-stone-600 w-14 text-right">{fmt(d.val)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-3">
                  Projeção com base na cadência de pagamentos trimestrais de cada posição. Os valores
                  e datas reais podem variar ligeiramente.
                </p>
              </div>
            )}

            {/* Calendário */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                  Calendário — {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setMesAtual(new Date(ano, mes - 1, 1))}
                    className="w-6 h-6 rounded-md border border-stone-200 text-stone-500 text-[12px] active:bg-stone-50">‹</button>
                  <button
                    onClick={() => setMesAtual(new Date(ano, mes + 1, 1))}
                    className="w-6 h-6 rounded-md border border-stone-200 text-stone-500 text-[12px] active:bg-stone-50">›</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-[3px] mb-3">
                {DIAS_SEMANA_PT.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-stone-400 py-1">{d}</div>
                ))}
                {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`e${i}`} />)}
                {diasArray.map(dia => {
                  const isEx   = exDividendDias.has(dia)
                  const isPay  = pagamentoDias.has(dia)
                  const isHoje = ehHoje(dia)
                  return (
                    <div key={dia}
                      className={`text-center text-[11px] py-[5px] rounded-md font-medium
                        ${isPay ? 'bg-brand-50 text-brand-800' :
                          isEx  ? 'bg-amber-100 text-amber-800' :
                          isHoje ? 'border border-brand-400 text-stone-900' :
                                   'text-stone-600'}`}>
                      {dia}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                  Ex-dividend
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <div className="w-3 h-3 rounded-sm bg-brand-50 border border-brand-200" />
                  Pagamento
                </div>
              </div>
              {exDividendDias.size === 0 && pagamentoDias.size === 0 && (
                <p className="text-[11px] text-stone-400 mt-3">
                  Sem datas de dividendos conhecidas para este mês.
                </p>
              )}
            </div>

            {/* Próximos pagamentos */}
            {proximosPagamentos.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                  Próximos pagamentos
                </p>
                {proximosPagamentos.map((p, i) => (
                  <div key={p.ticker}
                    className={`flex items-center gap-3 py-3
                      ${i < proximosPagamentos.length - 1 ? 'border-b border-stone-100' : ''}`}>
                    <div className="w-9 h-9 rounded-[9px] bg-stone-50 border border-stone-200
                      flex items-center justify-center text-[10px] font-semibold text-stone-600 flex-shrink-0">
                      {p.ticker.slice(0, 4)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-stone-900">{p.nome}</p>
                      <p className="text-[11px] text-stone-400">
                        Pagamento: {p.data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-brand-600">+{fmt(p.valor)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
