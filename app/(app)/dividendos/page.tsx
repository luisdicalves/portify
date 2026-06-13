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
type PosicaoAgregada = { ticker: string; tipo: string; unidades: number; preco_medio: number; moeda: string }
type DadosDividendo = {
  ticker: string; nome: string; dividendRate: number; dividendYield: number
  exDividendDate: string | null; dividendDate: string | null; moeda: string
  historico: { data: string; valor: number }[]
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getBandeira(ticker: string): string {
  const t = ticker.toUpperCase()
  if (t.endsWith('.DE')) return '🇩🇪'
  if (t.endsWith('.PA')) return '🇫🇷'
  if (t.endsWith('.AS')) return '🇳🇱'
  if (t.endsWith('.MI')) return '🇮🇹'
  if (t.endsWith('.MC')) return '🇪🇸'
  if (t.endsWith('.L'))  return '🇬🇧'
  if (t.endsWith('.T'))  return '🇯🇵'
  if (t.endsWith('.LS')) return '🇵🇹'
  if (t.endsWith('.SW')) return '🇨🇭'
  if (['VWCE','CSPX','IWDA','EIMI','IUSQ','VUSA','VUAA'].includes(t.split('.')[0])) return '🇮🇪'
  return '🇺🇸'
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function agregarPosicoes(transacoes: Transacao[]): PosicaoAgregada[] {
  const mapa = new Map<string, PosicaoAgregada>()
  for (const t of transacoes) {
    const ex = mapa.get(t.ticker)
    if (!ex) {
      mapa.set(t.ticker, { ticker: t.ticker, tipo: t.tipo, unidades: t.unidades, preco_medio: t.preco_medio, moeda: t.moeda })
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
  const [carregando,      setCarregando]      = useState(true)
  const [mostrarTodas,    setMostrarTodas]    = useState(false)

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

  const hoje = new Date()
  const inicioAno = new Date(hoje.getFullYear(), 0, 1)

  /* ─── Histórico real de pagamentos recebidos, por posição ─── */
  const dividendoAnualPorPosicao = posicoes.map(p => {
    const d = dividendos[p.ticker]
    const anual = d ? d.dividendRate * p.unidades : 0
    return { ticker: p.ticker, nome: d?.nome ?? p.ticker, tipo: p.tipo, anual, dadosDiv: d, unidades: p.unidades }
  })

  const custoTotal = posicoes.reduce((s, p) => s + p.preco_medio * p.unidades, 0)
  const totalAnualEstimado = dividendoAnualPorPosicao.reduce((s, p) => s + p.anual, 0)
  const yieldOnCost = custoTotal > 0 ? (totalAnualEstimado / custoTotal) * 100 : 0

  // Lista de pagamentos históricos reais (por posição), escalados pelas unidades atuais
  type PagamentoHistorico = { ticker: string; nome: string; tipo: string; data: Date; valor: number }
  const pagamentosHistoricos: PagamentoHistorico[] = []
  for (const p of dividendoAnualPorPosicao) {
    if (!p.dadosDiv?.historico) continue
    for (const h of p.dadosDiv.historico) {
      pagamentosHistoricos.push({
        ticker: p.ticker, nome: p.nome, tipo: p.tipo, data: new Date(h.data), valor: h.valor * p.unidades,
      })
    }
  }
  pagamentosHistoricos.sort((a, b) => b.data.getTime() - a.data.getTime())

  const totalRecebido = pagamentosHistoricos.reduce((s, p) => s + p.valor, 0)
  const recebidoEsteAno = pagamentosHistoricos
    .filter(p => p.data >= inicioAno && p.data <= hoje)
    .reduce((s, p) => s + p.valor, 0)

  const acoesComDividendo = dividendoAnualPorPosicao.filter(p => p.anual > 0).length

  /* ─── Projeção de pagamentos futuros (12 meses), com base na cadência real de cada ticker ───
     Estes pagamentos são a fonte única tanto da Previsão mensal como dos Próximos pagamentos
     e também alimentam a estimativa "este mês" / "este ano". */
  const horizonteFim = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate())

  type PagamentoProjetado = { ticker: string; nome: string; data: Date; valor: number }
  const pagamentosProjetados: PagamentoProjetado[] = []

  for (const p of dividendoAnualPorPosicao) {
    if (!p.dadosDiv?.dividendDate || p.anual <= 0) continue
    const valorPorPagamento = p.dadosDiv.dividendRate / 4 * p.unidades // trimestral típico

    let dataPagamento = new Date(p.dadosDiv.dividendDate)
    while (dataPagamento < new Date(hoje.getFullYear(), hoje.getMonth(), 1)) {
      dataPagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 3, dataPagamento.getDate())
    }
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
    return { ano: d.getFullYear(), mesIdx: d.getMonth(), mes: MESES_PT[d.getMonth()], val: Math.round(total * 100) / 100 }
  })
  const maxVal = Math.max(...previsaoMensal.map(d => d.val), 1)

  // Estimado este mês = soma das projeções para o mês corrente (mesma fonte que a previsão mensal)
  const estimadoEsteMes = previsaoMensal[0]?.val ?? 0

  // Estimado este ano = já recebido este ano + projeções até dezembro deste ano
  const estimadoRestoAno = previsaoMensal
    .filter(d => d.ano === hoje.getFullYear())
    .reduce((s, d) => s + d.val, 0)
  const estimadoEsteAno = recebidoEsteAno + estimadoRestoAno

  /* ─── Próximos pagamentos: primeiras ocorrências projetadas ─── */
  const proximosPagamentos = pagamentosProjetados.slice(0, 5)

  /* ─── Lista de ações que já deram dividendos, com total recebido por ticker ─── */
  const totalPorTicker = new Map<string, { ticker: string; nome: string; tipo: string; total: number; numPagamentos: number }>()
  for (const p of pagamentosHistoricos) {
    const ex = totalPorTicker.get(p.ticker)
    if (ex) { ex.total += p.valor; ex.numPagamentos += 1 }
    else totalPorTicker.set(p.ticker, { ticker: p.ticker, nome: p.nome, tipo: p.tipo, total: p.valor, numPagamentos: 1 })
  }
  const listaAcoesComDividendos = Array.from(totalPorTicker.values()).sort((a, b) => b.total - a.total)

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
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-stone-50 rounded-xl animate-pulse"/>)}
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
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total recebido',        value: fmt(totalRecebido),     green: true  },
                  { label: 'Recebido este ano',     value: fmt(recebidoEsteAno),   green: true  },
                  { label: 'Ações com dividendos',  value: String(acoesComDividendo), green: false },
                  { label: 'Estimado este mês',     value: fmt(estimadoEsteMes),   green: false },
                  { label: 'Estimado este ano',     value: fmt(estimadoEsteAno),   green: false },
                  { label: 'Yield on Cost',         value: yieldOnCost.toLocaleString('pt-PT',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%', green: false },
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

            {/* Ações que já deram dividendos */}
            {listaAcoesComDividendos.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                  Ações com dividendos recebidos
                </p>
                {(mostrarTodas ? listaAcoesComDividendos : listaAcoesComDividendos.slice(0, 3)).map((a, i, arr) => (
                  <div key={a.ticker}
                    className={`flex items-center gap-3 py-3
                      ${i < arr.length - 1 ? 'border-b border-stone-100' : ''}`}>
                    <div className="w-10 h-10 rounded-[10px] bg-stone-50 border border-stone-200
                      flex items-center justify-center text-[16px] flex-shrink-0">
                      {getBandeira(a.ticker)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-stone-900 truncate">{a.nome}</p>
                        <span className="text-[10px] font-medium px-2 py-[2px] rounded-full bg-stone-100 text-stone-500 flex-shrink-0">{a.tipo}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{a.ticker}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-semibold text-brand-600">+{fmt(a.total)}</p>
                      <p className="text-[11px] text-stone-400">
                        {a.numPagamentos} pagamento{a.numPagamentos > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {listaAcoesComDividendos.length > 3 && (
                  <button
                    onClick={() => setMostrarTodas(v => !v)}
                    className="w-full text-center text-[12px] text-brand-600 font-medium pt-3 mt-1 border-t border-stone-100">
                    {mostrarTodas
                      ? 'Mostrar menos'
                      : `Mostrar mais ${listaAcoesComDividendos.length - 3} ação${listaAcoesComDividendos.length - 3 > 1 ? 'ões' : ''}`}
                  </button>
                )}
              </div>
            )}

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

            {/* Próximos pagamentos */}
            {proximosPagamentos.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                  Próximos pagamentos
                </p>
                {proximosPagamentos.map((p, i) => (
                  <div key={`${p.ticker}-${i}`}
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
